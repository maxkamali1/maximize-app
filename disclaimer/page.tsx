import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";

export const metadata = {
  title: "Disclaimer | MAXimize",
};

export default function DisclaimerPage() {
  return (
    <div className="flex flex-col flex-1">
      <BrandHeader eyebrow="Disclaimer" />
      <main className="flex-1 bg-paper">
        <section className="mx-auto max-w-2xl px-6 pt-12 pb-20">
          <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
            Legal
          </p>
          <h1 className="font-display text-3xl font-semibold mb-8">Disclaimer</h1>

          <div className="flex flex-col gap-5 text-sm text-ink-soft leading-relaxed">
            <p>
              The information provided on this site is for general informational purposes
              only and is subject to change without notice. While we strive for accuracy, we
              make no warranties or representations as to its completeness or reliability.
              Nothing on this site constitutes legal, financial, tax, or other professional
              advice. Figures shown by any calculator or estimate tool (including
              affordability, mortgage, and investment analysis features) are planning
              estimates only, based on assumptions that may not match your actual financing,
              taxes, or closing costs — always verify current numbers with your lender,
              accountant, and legal counsel before making a decision.
            </p>
            <p>
              This site is provided by MAXimize Team, a service of Max Kamali, Broker,
              Registration #4745936, at RE/MAX West Realty Inc., Brokerage. Browsing this
              site, using its tools, or submitting a form does not create a client, agency,
              or representation relationship between you and MAXimize Team, Max Kamali,
              RE/MAX West Realty Inc., or any of its agents. If you&rsquo;d like to be
              represented in a real estate transaction, please contact Max Kamali directly to
              establish that relationship formally.
            </p>
            <p>
              Always verify information independently and consult the appropriate licensed
              professionals — a Realtor, lawyer, mortgage advisor, or accountant — before
              making real estate decisions.
            </p>
          </div>

          <Link
            href="/"
            className="inline-block mt-10 text-sm underline text-ink-faint hover:text-accent"
          >
            ← Back to home
          </Link>
        </section>
      </main>
    </div>
  );
}
