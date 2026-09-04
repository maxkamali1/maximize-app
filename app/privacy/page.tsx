import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";

export const metadata = {
  title: "Privacy Policy | MAXimize",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col flex-1">
      <BrandHeader eyebrow="Privacy Policy" />
      <main className="flex-1 bg-paper">
        <section className="mx-auto max-w-2xl px-6 pt-12 pb-20">
          <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
            Legal
          </p>
          <h1 className="font-display text-3xl font-semibold mb-8">Privacy Policy</h1>

          <div className="flex flex-col gap-5 text-sm text-ink-soft leading-relaxed">
            <p>
              This policy explains what information this site collects when you use it, and how
              that information is used. It applies to maximizeteam.ca and its mobile apps.
            </p>

            <h2 className="font-display text-lg font-semibold text-ink mt-2">
              Information we collect
            </h2>
            <p>
              When you fill out a form on this site — for example, to explore buying, selling,
              or investing, request a home valuation, request a showing, send a message, or
              submit a referral — we collect the information you provide, which may include your
              name, email address, phone number, preferred contact method, and details relevant
              to your goal (such as budget, property address, timeline, or financial figures you
              enter into a calculator). We do not collect this information unless you submit a
              form yourself.
            </p>
            <p>
              We also use a browser cookie to remember who you are as you move between pages on
              this site, so your dashboard and saved information stay associated with you during
              and after your visit. This cookie does not track you on other websites.
            </p>

            <h2 className="font-display text-lg font-semibold text-ink mt-2">
              How we use your information
            </h2>
            <p>
              We use the information you provide to follow up with you about your real estate
              goals — for example, to respond to a showing or valuation request, answer a
              question you've sent, or reach out about a referral. We do not sell your
              information, and we do not share it with third parties for their own marketing
              purposes.
            </p>

            <h2 className="font-display text-lg font-semibold text-ink mt-2">
              Data storage and retention
            </h2>
            <p>
              Information you submit is stored securely in a database used to operate this site.
              It is retained for as long as needed to provide the services described above, or
              until you ask us to delete it.
            </p>

            <h2 className="font-display text-lg font-semibold text-ink mt-2">
              Your choices
            </h2>
            <p>
              You can ask us to access, correct, or delete the information we hold about you at
              any time by contacting us using the information below. You are never required to
              submit information on this site to browse it.
            </p>

            <h2 className="font-display text-lg font-semibold text-ink mt-2">Contact us</h2>
            <p>
              This site is operated by Max Kamali, Broker, Registration #4745936, at RE/MAX West
              Realty Inc., Brokerage. If you have questions about this privacy policy or your
              information, contact us at maxkamali1@gmail.com.
            </p>

            <p className="text-xs text-ink-faint mt-4">Last updated: {new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}.</p>
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
