import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";
import { DataStore, emptyStore, Property } from "./types";

// A few sample listings so the comparison tool has something real to work
// with on first run. Swap or clear these once real saved properties exist.
const seedProperties: Property[] = [
  {
    id: "prop_seed_1",
    address: "42 Birchmount Rd",
    city: "Scarborough, ON",
    price: 899000,
    beds: 3,
    baths: 2,
    sqft: 1450,
    lotSize: "30 x 110 ft",
    taxesAnnual: 4210,
    basement: "Finished, separate entrance",
    parking: "Private drive, 2 spaces",
    notes: "Updated kitchen 2022. Walk to GO station.",
  },
  {
    id: "prop_seed_2",
    address: "18 Maple Grove Ave",
    city: "Ajax, ON",
    price: 849000,
    beds: 4,
    baths: 3,
    sqft: 1980,
    lotSize: "36 x 105 ft",
    taxesAnnual: 5680,
    basement: "Unfinished",
    parking: "Attached garage, 2 spaces",
    notes: "Newer build (2019). Larger lot, quieter street.",
  },
  {
    id: "prop_seed_3",
    address: "210 Lakeshore Blvd, Unit 1105",
    city: "Toronto, ON",
    price: 725000,
    beds: 2,
    baths: 2,
    sqft: 890,
    condoFeesMonthly: 612,
    taxesAnnual: 3120,
    parking: "1 owned space",
    notes: "Lake view. Condo fees include heat + water.",
  },
];

const SEEDED_STORE: DataStore = { ...emptyStore, properties: seedProperties };

// ---------------------------------------------------------------------------
// Two backends behind the same readStore/writeStore contract:
//
//  - Postgres, when a connection string is present (DATABASE_URL / POSTGRES_URL
//    / POSTGRES_PRISMA_URL — Vercel's Postgres integration sets these). This is
//    what runs in production: a hosted server's filesystem is read-only, so a
//    JSON file on disk silently fails to save there (this is exactly the bug
//    that made the live buyer dashboard come back empty).
//  - A local JSON file, when no connection string is set. This is what runs
//    during local development/testing in this workspace, with zero external
//    accounts needed.
//
// Both sides store the *entire* app's data as one JSON document — same shape
// as before — so nothing in repo.ts or actions.ts needed to change.
// ---------------------------------------------------------------------------

const CONNECTION_STRING =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

const USE_POSTGRES = Boolean(CONNECTION_STRING);

// ---- Postgres backend ------------------------------------------------------

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: CONNECTION_STRING,
      // Vercel's hosted Postgres requires SSL; a local Postgres instance
      // (used for development/testing) does not speak SSL by default.
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = getPool();
      await client.query(
        `CREATE TABLE IF NOT EXISTS maximize_store (
           id text PRIMARY KEY,
           data jsonb NOT NULL
         )`
      );
      await client.query(
        `INSERT INTO maximize_store (id, data) VALUES ('main', $1)
         ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(SEEDED_STORE)]
      );
    })();
  }
  return schemaReady;
}

async function readStorePostgres(): Promise<DataStore> {
  await ensureSchema();
  const { rows } = await getPool().query<{ data: DataStore }>(
    "SELECT data FROM maximize_store WHERE id = 'main'"
  );
  return rows[0]?.data ?? { ...SEEDED_STORE };
}

async function writeStorePostgres(mutate: (store: DataStore) => void): Promise<DataStore> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    // Row-level lock for the duration of this transaction, so two requests
    // hitting the server at the same moment can't clobber each other's
    // changes — the second one simply waits for the first to commit.
    const { rows } = await client.query<{ data: DataStore }>(
      "SELECT data FROM maximize_store WHERE id = 'main' FOR UPDATE"
    );
    const store: DataStore = rows[0]?.data ?? { ...SEEDED_STORE };
    mutate(store);
    await client.query("UPDATE maximize_store SET data = $1 WHERE id = 'main'", [
      JSON.stringify(store),
    ]);
    await client.query("COMMIT");
    return store;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ---- Local JSON file backend (development/testing only) ------------------

const DB_PATH = path.join(process.cwd(), "data", "db.json");

async function ensureFile() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(SEEDED_STORE, null, 2), "utf-8");
  }
}

// Simple in-process write queue so concurrent requests in dev don't clobber
// each other's writes. Fine for a single-instance prototype.
let writeQueue: Promise<unknown> = Promise.resolve();

async function readStoreFile(): Promise<DataStore> {
  await ensureFile();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw) as DataStore;
  } catch {
    return { ...emptyStore };
  }
}

async function writeStoreFile(mutate: (store: DataStore) => void): Promise<DataStore> {
  const run = async () => {
    const store = await readStoreFile();
    mutate(store);
    await fs.writeFile(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
    return store;
  };
  writeQueue = writeQueue.then(run, run);
  return writeQueue as Promise<DataStore>;
}

// ---- Public contract (unchanged) ------------------------------------------

export async function readStore(): Promise<DataStore> {
  return USE_POSTGRES ? readStorePostgres() : readStoreFile();
}

export async function writeStore(mutate: (store: DataStore) => void): Promise<DataStore> {
  return USE_POSTGRES ? writeStorePostgres(mutate) : writeStoreFile(mutate);
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
