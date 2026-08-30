import { BrandHeader } from "@/components/BrandHeader";
import { adminLoginAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col flex-1">
      <BrandHeader eyebrow="Admin" />
      <main className="flex-1 mx-auto max-w-sm w-full px-6 py-16 flex flex-col gap-6">
        <div>
          <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
            Restricted
          </p>
          <h1 className="font-display text-2xl font-semibold mb-2">Admin access</h1>
          <p className="text-sm text-ink-soft">
            This section has lead contact info in it — enter the access code to continue.
          </p>
        </div>

        <form action={adminLoginAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Access code</span>
            <input
              type="password"
              name="code"
              required
              autoFocus
              className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>

          {error && (
            <p className="text-sm text-warn">That code isn&rsquo;t right — try again.</p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-full bg-accent text-accent-ink px-5 py-2.5 text-sm font-medium hover:bg-accent-strong transition-colors self-start"
          >
            Enter
          </button>
        </form>
      </main>
    </div>
  );
}
