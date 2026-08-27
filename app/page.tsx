import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";

const GOALS: {
  slug: string;
  title: string;
  description: string;
  ready: boolean;
}[] = [
  {
    slug: "buying",
    title: "I'm Buying",
    description: "Affordability, saved homes, and a plan to get from looking to closing.",
    ready: true,
  },
  {
    slug: "selling",
    title: "I'm Selling",
    description: "Prep your home, track showings, and see offers as they come in.",
    ready: true,
  },
  {
    slug: "homeowner",
    title: "I'm a Homeowner",
    description: "Track your home's value, maintenance, and important dates.",
    ready: true,
  },
  {
    slug: "investing",
    title: "I'm Investing",
    description: "Run the numbers on a property before you make an offer.",
    ready: true,
  },
  {
    slug: "exploring",
    title: "I'm Just Exploring",
    description: "No pressure — poke around, ask a question, see what's useful.",
    ready: true,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <BrandHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-16 pb-10">
          <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-4">
            Welcome
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold max-w-xl mb-4">
            What brings you here today?
          </h1>
          <p className="max-w-lg text-ink-soft">
            Pick the one that fits — everything after this is built around it. No account
            needed yet, and nothing here replaces a real conversation with your Realtor.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-2">
            {GOALS.map((goal) => (
              <Link
                key={goal.slug}
                href={`/start/${goal.slug}`}
                className="group rounded-xl border border-line bg-surface p-6 shadow-sm hover:border-accent transition-colors flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold group-hover:text-accent transition-colors">
                    {goal.title}
                  </h2>
                  {goal.ready ? (
                    <span className="font-data text-[0.65rem] uppercase tracking-wide border border-accent text-accent-ink bg-accent-soft rounded-full px-2 py-0.5">
                      Available
                    </span>
                  ) : (
                    <span className="font-data text-[0.65rem] uppercase tracking-wide border border-line-strong text-ink-faint rounded-full px-2 py-0.5">
                      Coming next
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-soft">{goal.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-ink-faint font-data flex items-center justify-between flex-wrap gap-2">
          <span>
            MAXimize Team &middot; RE/MAX West Realty Inc., Brokerage &middot; Prototype build,
            not for public use.
          </span>
          <Link href="/admin" className="underline hover:text-accent">
            Max&rsquo;s view →
          </Link>
        </div>
      </footer>
    </div>
  );
}
