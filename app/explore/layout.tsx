import { BrandHeader } from "@/components/BrandHeader";
import { requireGoal, getCurrentContactId } from "@/lib/actions";
import { getContact } from "@/lib/data/repo";

export default async function ExploreLayout({ children }: { children: React.ReactNode }) {
  await requireGoal("exploring");
  const contactId = (await getCurrentContactId())!;
  const contact = await getContact(contactId);

  return (
    <div className="flex flex-col flex-1">
      <BrandHeader eyebrow="Just exploring" />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-ink-faint font-data">
          Signed in as {contact?.name} &middot; {contact?.email}
        </div>
      </footer>
    </div>
  );
}
