import Link from "next/link";

// `dark` is only used on the homepage's navy hero — every other page calls
// this with no props and gets the ordinary light header, unaffected.
export function BrandHeader({ eyebrow, dark }: { eyebrow?: string; dark?: boolean }) {
  return (
    // `pt-[env(safe-area-inset-top)]` clears the iPhone notch/Dynamic
    // Island: Capacitor's WKWebView draws edge-to-edge behind it, so
    // without this the wordmark renders underneath the status bar. Falls
    // back to 0 on browsers/devices with no notch, so the extra `pt-4`
    // keeps a small, consistent gap above the header everywhere.
    <header
      className={`pt-[env(safe-area-inset-top)] ${dark ? "border-b border-white/15" : "border-b border-line"}`}
    >
      <div className="mx-auto max-w-5xl px-6 pt-4 pb-6 flex items-center justify-between gap-4">
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
