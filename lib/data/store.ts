import { promises as fs } from "fs";
import path from "path";
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

// A JSON-file data store. This stands in for Postgres/Supabase during the
// first build slice so the app is fully runnable with zero external
// accounts. The field shapes match the Blueprint's schema on purpose —
// swapping this module for a real Prisma/Postgres client later shouldn't
// require touching any page or component.

const DB_PATH = path.join(process.cwd(), "data", "db.json");

async function ensureFile() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    const seeded: DataStore = { ...emptyStore, properties: seedProperties };
    await fs.writeFile(DB_PATH, JSON.stringify(seeded, null, 2), "utf-8");
  }
}

// Simple in-process write queue so concurrent requests in dev don't clobber
// each other's writes. Fine for a single-instance prototype.
let writeQueue: Promise<unknown> = Promise.resolve();

export async function readStore(): Promise<DataStore> {
  await ensureFile();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw) as DataStore;
  } catch {
    return { ...emptyStore };
  }
}

export async function writeStore(mutate: (store: DataStore) => void): Promise<DataStore> {
  const run = async () => {
    const store = await readStore();
    mutate(store);
    await fs.writeFile(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
    return store;
  };
  writeQueue = writeQueue.then(run, run);
  return writeQueue as Promise<DataStore>;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
