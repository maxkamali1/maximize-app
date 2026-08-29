import Link from "next/link";
import { ConfirmationBanner } from "@/components/ConfirmationBanner";
import { sendMessageAction } from "@/lib/actions";
import { getMessagesForContact } from "@/lib/data/repo";
import { getCurrentContactId } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  const contactId = (await getCurrentContactId())!;
  const messages = await getMessagesForContact(contactId);

  return (
    <div className="flex flex-col gap-10">
      {sent && <ConfirmationBanner>Message sent — Max will get back to you.</ConfirmationBanner>}

      <div>
        <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">Welcome</p>
        <h1 className="font-display text-3xl font-semibold mb-2">
          Look around. Nothing here needs a decision today.
        </h1>
        <p className="text-ink-soft max-w-xl">
          Whenever you do know what you're after, one of these gets you a real dashboard —
          affordability numbers, a prep checklist, whatever fits. Until then, this page and
          Max are both here.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/start/buying"
          className="group rounded-xl border border-line bg-surface p-5 hover:border-accent transition-colors"
        >
          <p className="font-display text-lg font-semibold group-hover:text-accent transition-colors mb-1">
            I think I'm buying
          </p>
          <p className="text-sm text-ink-soft">
            Affordability numbers and a place to compare homes side by side.
          </p>
        </Link>
        <Link
          href="/start/selling"
          className="group rounded-xl border border-line bg-surface p-5 hover:border-accent transition-colors"
        >
          <p className="font-display text-lg font-semibold group-hover:text-accent transition-colors mb-1">
            I think I'm selling
          </p>
          <p className="text-sm text-ink-soft">
            A prep checklist and a straight answer on what your home is worth.
          </p>
        </Link>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5 max-w-xl">
        <p className="font-display text-lg font-semibold mb-1">Ask Max</p>
        <p className="text-sm text-ink-soft mb-3">
          Any question at all — even if it's just "where do I even start?"
        </p>
        <form action={sendMessageAction} className="flex flex-col gap-2">
          <input type="hidden" name="from" value="exploring" />
          <textarea
            name="body"
            rows={2}
            required
            placeholder="What's on your mind?"
            className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="self-start rounded-full bg-accent text-accent-ink px-4 py-2 text-xs font-medium hover:bg-accent-strong transition-colors"
          >
            Send
          </button>
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
    </div>
  );
}
