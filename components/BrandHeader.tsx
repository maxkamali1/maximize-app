import Link from "next/link";

// `dark` is only used on the homepage's navy hero — every other page calls
// this with no props and gets the ordinary light header, unaffected.
export function BrandHeader({ eyebrow, dark }: { eyebrow?: string; dark?: boolean }) {
  return (
    // Capacitor's WKWebView draws edge-to-edge behind the status bar/
    // Dynamic Island, so without top clearance the wordmark renders
    // underneath it. `env(safe-area-inset-top)` is the "correct" value for
    // this, but a fixed 3.25rem floor guarantees clearance even on setups
    // where that value doesn't get reported (plain browsers just use the
    // floor, since env() resolves to 0 there).
    <header
      className={dark ? "border-b border-white/15" : "border-b border-line"}
      style={{ paddingTop: "max(3.25rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto max-w-5xl px-6 pt-2 pb-6 flex items-center justify-between gap-4">
        <Link href="/" className="flex flex-col leading-tight group">
          <span
            className={`font-display text-lg font-semibold transition-colors ${
              dark ? "text-white group-hover:text-blue-200" : "text-ink group-hover:text-accent"
            }`}
          >
            MAXimize Your Success
          </span>
          <span
            className={`font-data text-[0.65rem] tracking-wide uppercase ${
              dark ? "text-white/60" : "text-ink-faint"
            }`}
          >
            {eyebrow ?? "Max Kamali, Broker"}
          </span>
          {!eyebrow && (
            <span
              className={`font-data text-[0.65rem] tracking-wide uppercase ${
                dark ? "text-white/60" : "text-ink-faint"
              }`}
            >
              MAXimize Team Leader
            </span>
          )}
        </Link>
        <p className={`hidden sm:block font-display italic text-sm ${dark ? "text-blue-200" : "text-accent"}`}>
          &ldquo;Your Decision &amp; Our Commitment.&rdquo;
        </p>
      </div>
    </header>
  );
}
