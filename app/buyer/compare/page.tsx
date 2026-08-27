import { CompareForm } from "@/components/CompareForm";
import { ConfirmationBanner } from "@/components/ConfirmationBanner";
import { getCurrentContactId } from "@/lib/actions";
import { listProperties, getComparisonForContact } from "@/lib/data/repo";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const contactId = (await getCurrentContactId())!;
  const [properties, comparison] = await Promise.all([
    listProperties(),
    getComparisonForContact(contactId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {saved && (
        <ConfirmationBanner>
          Comparison saved — Max sees exactly what you&rsquo;re weighing.
        </ConfirmationBanner>
      )}

      <div>
        <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-2">
          Decision tool, not a listings feed
        </p>
        <h1 className="font-display text-3xl font-semibold mb-2">Compare homes side by side</h1>
        <p className="text-ink-soft max-w-xl">
          Select up to four, jot down what you like and what gives you pause, and Max
          sees exactly the same comparison you do.
        </p>
      </div>
      <CompareForm properties={properties} existing={comparison} />
    </div>
  );
}
