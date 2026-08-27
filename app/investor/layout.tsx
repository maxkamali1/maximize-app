import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { requireGoal, getCurrentContactId } from "@/lib/actions";
import { getContact } from "@/lib/data/repo";

export default async function InvestorLayout({ children }: { children: React.ReactNode }) {
  await requireGoal("investing");
  const contactId = (await getCurrentContactId())!;
  const contact = await getContact(contactId);

  return (
    <div className="flex flex-col flex-1">
      <BrandHeader eyebrow="Investor dashboard" />
      <div className="border-b border-line bg-surface">
        <nav className="mx-auto max-w-5xl px-6 flex gap-6 text-sm">
          <TabLink href="/investor">Analyzer</TabLink>
          <TabLink href="/investor/compare">Compare saved</TabLink>
        </nav>
      </div>
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-10">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-ink-faint font-data">
          Signed in as {contact?.name} &middot; {contact?.email}
        </div>
      </footer>
    </div>
  );
}

function TabLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="py-3.5 border-b-2 border-transparent hover:border-accent hover:text-accent transition-colors text-ink-soft"
    >
      {children}
    </Link>
  );
}
