import { submitShowingRequest } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function ShowingPage() {
  return (
    <div className="max-w-xl">
      <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
        Request a showing
      </p>
      <h1 className="font-display text-3xl font-semibold mb-2">
        Tell Max what you want to see.
      </h1>
      <p className="text-ink-soft mb-8">
        This goes straight to Max&rsquo;s attention list — expect a reply the same day.
      </p>

      <form action={submitShowingRequest} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink" htmlFor="propertyAddress">
            Property address or listing
          </label>
          <input
            id="propertyAddress"
            name="propertyAddress"
            required
            placeholder="42 Birchmount Rd, Scarborough"
            className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink" htmlFor="preferredWindow">
            When works for you?
          </label>
          <input
            id="preferredWindow"
            name="preferredWindow"
            required
            placeholder="This weekend, mornings"
            className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink" htmlFor="notes">
            Anything Max should know?
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Optional"
            className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-full bg-ink text-paper px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          Send request
        </button>
      </form>
    </div>
  );
}
