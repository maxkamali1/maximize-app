import Link from "next/link";

export function BrandHeader({ eyebrow }: { eyebrow?: string }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between gap-4">
        <Link href="/" className="flex flex-col leading-tight group">
          <span className="font-display text-lg font-semibold text-ink group-hover:text-accent transition-colors">
            MAXimize
          </span>
          <span className="font-data text-[0.65rem] tracking-wide uppercase text-ink-faint">
            {eyebrow ?? "RE/MAX West Realty Inc."}
          </span>
        </Link>
        <p className="hidden sm:block font-display italic text-accent text-sm">
          &ldquo;Your Decision &amp; Our Commitment.&rdquo;
        </p>
      </div>
    </header>
  );
}
