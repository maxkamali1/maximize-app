import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";

// Small, low-opacity real-estate icons scattered across the navy hero —
// decorative only (aria-hidden, no pointer events), kept out of the way of
// the headline/paragraph text and sized/faded down so they read as texture,
// not clutter.
const HERO_EMOJI: { icon: string; top: string; left: string; size: string; rotate: number; opacity: string }[] = [
  { icon: "🏠", top: "22%", left: "70%", size: "text-4xl", rotate: -10, opacity: "opacity-15" },
  { icon: "🤝", top: "14%", left: "88%", size: "text-3xl", rotate: 8, opacity: "opacity-15" },
  { icon: "💰", top: "30%", left: "58%", size: "text-3xl", rotate: 10, opacity: "opacity-10" },
  { icon: "🔑", top: "4%", left: "45%", size: "text-2xl", rotate: -14, opacity: "opacity-10" },
  { icon: "🏠", top: "58%", left: "82%", size: "text-3xl", rotate: 6, opacity: "opacity-15" },
  { icon: "📝", top: "72%", left: "62%", size: "text-2xl", rotate: -8, opacity: "opacity-10" },
  { icon: "🤝", top: "78%", left: "90%", size: "text-2xl", rotate: -5, opacity: "opacity-10" },
  { icon: "💰", top: "48%", left: "92%", size: "text-2xl", rotate: 12, opacity: "opacity-10" },
  { icon: "🔑", top: "82%", left: "40%", size: "text-2xl", rotate: 15, opacity: "opacity-10" },
];

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

// Option B: a navy hero BAND (header + welcome intro) with a scattering of
// small, faint real-estate emoji behind the text, then the page transitions
// into the same light background every other screen in the app uses — so
// the strong first impression doesn't create a jarring dark-to-light jump
// the moment someone picks a persona. Cards sit on a soft light-blue tint;
// red stays reserved for admin/urgent things elsewhere in the app, so
// badges here are solid blue instead.
export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <div
        className="relative overflow-hidden text-white"
        style={{
          background: "linear-gradient(180deg, #16407a 0%, #0a1830 100%)",
        }}
      >
        <div aria-hidden className="pointer-events-none select-none absolute inset-0 z-0">
          {HERO_EMOJI.map((e, i) => (
            <span
              key={i}
              className={`absolute ${e.size} ${e.opacity}`}
              style={{ top: e.top, left: e.left, transform: `rotate(${e.rotate}deg)` }}
            >
              {e.icon}
            </span>
          ))}
        </div>

        <div className="relative z-10">
          <BrandHeader dark />
          <section className="mx-auto max-w-5xl px-6 pt-16 pb-20">
            <p className="font-data text-xs tracking-wide uppercase text-white/70 mb-4">
              Welcome
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold max-w-xl mb-4 text-white">
              What brings you here today?
            </h1>
            <p className="max-w-lg text-blue-100/80">
              Pick the one that fits — everything after this is built around it. No account
              needed yet, and nothing here replaces a real conversation with your Realtor.
            </p>
          </section>
        </div>
      </div>

      <main className="flex-1 bg-paper">
        <section className="mx-auto max-w-5xl px-6 pt-10 pb-20">
          <div className="grid gap-4 sm:grid-cols-2">
            {GOALS.map((goal) => (
              <Link
                key={goal.slug}
                href={`/start/${goal.slug}`}
                className="group rounded-xl border border-accent/15 bg-accent-soft/40 p-6 shadow-md hover:bg-accent-soft/70 hover:border-accent/30 transition-colors flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold text-ink group-hover:text-accent transition-colors">
                    {goal.title}
                  </h2>
                  {goal.ready ? (
                    <span className="font-data text-[0.65rem] uppercase tracking-wide bg-accent text-accent-ink rounded-full px-2 py-0.5 font-semibold">
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
      <footer className="border-t border-line bg-paper">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-ink-faint font-data flex items-center justify-between flex-wrap gap-2">
          <span>
            MAXimize Team &middot; RE/MAX West Realty Inc., Brokerage &middot; Prototype build,
            not for public use.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/disclaimer" className="underline hover:text-accent">
              Disclaimer
            </Link>
            <div className="flex items-center gap-4">
            <Link href="/disclaimer" className="underline hover:text-accent">
              Disclaimer
            </Link>
            <Link href="/admin" className="underline hover:text-accent">
              Max&rsquo;s view →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
