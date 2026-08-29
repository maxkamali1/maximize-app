import { ToggleCheckbox } from "@/components/ToggleCheckbox";
import { ConfirmationBanner } from "@/components/ConfirmationBanner";
import {
  getCurrentContactId,
  toggleMaintenance,
  requestValuationAction,
  sendMessageAction,
  submitReferral,
} from "@/lib/actions";
import {
  getHomeProfile,
  getMaintenanceForContact,
  hasRequestedValuation,
  getMessagesForContact,
} from "@/lib/data/repo";
import type { Season, MaintenanceReminder } from "@/lib/data/types";

export const dynamic = "force-dynamic";

const SEASON_ORDER: Season[] = ["Fall", "Winter", "Spring", "Summer", "Anytime"];

function yearsOwned(purchaseDate?: string): string | undefined {
  if (!purchaseDate) return undefined;
  const start = new Date(purchaseDate).getTime();
  if (Number.isNaN(start)) return undefined;
  const years = (Date.now() - start) / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 1) return "less than a year";
  return `${Math.floor(years)} year${Math.floor(years) === 1 ? "" : "s"}`;
}

function renewalCountdown(renewalDate?: string): string | undefined {
  if (!renewalDate) return undefined;
  const target = new Date(renewalDate).getTime();
  if (Number.isNaN(target)) return undefined;
  const days = Math.round((target - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "already passed — worth a quick check-in with your lender";
  if (days === 0) return "today";
  if (days < 60) return `in ${days} day${days === 1 ? "" : "s"}`;
  const months = Math.round(days / 30);
  return `in about ${months} month${months === 1 ? "" : "s"}`;
}

export default async function HomeownerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string; sent?: string; referred?: string }>;
}) {
  const { requested, sent, referred } = await searchParams;
  const contactId = (await getCurrentContactId())!;
  const [homeProfile, reminders, valuationRequested, messages] = await Promise.all([
    getHomeProfile(contactId),
    getMaintenanceForContact(contactId),
    hasRequestedValuation(contactId),
    getMessagesForContact(contactId),
  ]);

  const owned = yearsOwned(homeProfile?.purchaseDate);
  const renewal = renewalCountdown(homeProfile?.mortgageRenewalDate);
  const remindersDone = reminders.filter((r) => r.isComplete).length;

  const bySeason = reminders.reduce<Record<Season, MaintenanceReminder[]>>(
    (acc, r) => {
      acc[r.season].push(r);
      return acc;
    },
    { Fall: [], Winter: [], Spring: [], Summer: [], Anytime: [] }
  );

  return (
    <div className="flex flex-col gap-10">
      {requested && (
        <ConfirmationBanner>
          Valuation requested — Max will follow up with real numbers, not a guess.
        </ConfirmationBanner>
      )}
      {sent && <ConfirmationBanner>Message sent — Max will get back to you.</ConfirmationBanner>}
      {referred && (
        <ConfirmationBanner>Thank you — Max will reach out to say hello.</ConfirmationBanner>
      )}

      <div>
        <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">My Home</p>
        <h1 className="font-display text-3xl font-semibold mb-2">{homeProfile?.address}</h1>
        <p className="text-ink-soft max-w-xl">
          {owned ? `Yours for ${owned}. ` : ""}
          {renewal ? `Mortgage renewal ${renewal}.` : ""}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-display text-lg font-semibold">Home value</p>
            {valuationRequested && <Badge>Requested</Badge>}
          </div>
          <p className="text-sm text-ink-soft mb-4">
            No auto-generated estimate here — Max will give you a real number.
          </p>
          {!valuationRequested && (
            <form action={requestValuationAction}>
              <input type="hidden" name="from" value="homeowner" />
              <SmallButton>Request a valuation</SmallButton>
            </form>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="font-display text-lg font-semibold mb-1">Ask Max</p>
          <p className="text-sm text-ink-soft mb-3">
            Any real estate question — no need for it to be urgent.
          </p>
          <form action={sendMessageAction} className="flex flex-col gap-2">
            <input type="hidden" name="from" value="homeowner" />
            <textarea
              name="body"
              rows={2}
              required
              placeholder="What's on your mind?"
              className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <SmallButton>Send</SmallButton>
          </form>
          {messages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-line flex flex-col gap-2">
              {messages.slice(0, 3).map((m) => (
                <p key={m.id} className="text-xs text-ink-faint">
                  <span className="text-ink-soft">Sent to Max:</span> {m.body}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="font-display text-lg font-semibold mb-1">Refer a friend</p>
          <p className="text-sm text-ink-soft mb-3">
            Know someone buying, selling, or curious? Max will reach out personally.
          </p>
          <form action={submitReferral} className="flex flex-col gap-2">
            <input
              name="referredName"
              required
              placeholder="Their name"
              className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              name="referredContact"
              required
              placeholder="Their email or phone"
              className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <SmallButton>Send referral</SmallButton>
          </form>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-semibold">Home maintenance</h2>
          <p className="font-data text-sm text-ink-faint">
            {remindersDone}/{reminders.length} done
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {SEASON_ORDER.filter((s) => bySeason[s].length > 0).map((season) => (
            <div key={season} className="rounded-xl border border-line bg-surface p-5">
              <p className="font-data text-[0.65rem] uppercase tracking-wide text-ink-faint mb-3">
                {season}
              </p>
              <div className="flex flex-col gap-2.5">
                {bySeason[season].map((item) => (
                  <ToggleCheckbox
                    key={item.id}
                    checked={item.isComplete}
                    label={item.label}
                    action={toggleMaintenance.bind(null, item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-data text-[0.6rem] uppercase tracking-wide bg-accent text-accent-ink rounded-full px-2 py-0.5 font-semibold">
      {children}
    </span>
  );
}

function SmallButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="self-start rounded-full bg-accent text-accent-ink px-4 py-2 text-xs font-medium hover:bg-accent-strong transition-colors"
    >
      {children}
    </button>
  );
}
