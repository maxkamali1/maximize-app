// A confirmation that's meant to be impossible to miss — solid accent fill
// (not a soft tint), a checkmark, and a brief entrance pop. Added after Max
// almost mistook two dashboard states for identical screenshots: a subtle
// bordered tint wasn't doing its job, so this trades subtlety for clarity
// on purpose.
export function ConfirmationBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-accent text-accent-ink px-5 py-4 flex items-center gap-3 shadow-sm motion-safe:animate-banner-in">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="11" fill="currentColor" fillOpacity="0.16" />
        <path
          d="M7.5 12.5l3 3 6-6.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-semibold text-[0.95rem] leading-snug">{children}</span>
    </div>
  );
}
