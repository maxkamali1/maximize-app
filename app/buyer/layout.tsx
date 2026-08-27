import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { getCurrentContactId } from "@/lib/actions";
import { getContact } from "@/lib/data/repo";

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const contactId = await getCurrentContactId();
  if (!contactId) redirect("/");

  const contact = await getContact(contactId);
  if (!contact) redirect("/");

  return (
    <div className="flex flex-col flex-1">
      <BrandHeader eyebrow="Buyer dashboard" />
      <div className="border-b border-line bg-surface">
        <nav className="mx-auto max-w-5xl px-6 flex gap-6 text-sm">
          <TabLink href="/buyer">Dashboard</TabLink>
          <TabLink href="/buyer/compare">Compare homes</TabLink>
          <TabLink href="/buyer/showing">Request a showing</TabLink>
        </nav>
      </div>
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-ink-faint font-data">
          Signed in as {contact.name} &middot; {contact.email}
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
