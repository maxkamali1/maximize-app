import { BrandHeader } from "@/components/BrandHeader";
import {
  submitBuyerOnboarding,
  submitSellerOnboarding,
  submitHomeownerOnboarding,
  submitInvestorOnboarding,
  submitExploringOnboarding,
} from "@/lib/actions";

export default async function StartGoalPage({
  params,
}: {
  params: Promise<{ goal: string }>;
}) {
  const { goal } = await params;

  const config = {
    buying: {
      eyebrow: "Buying · two minutes",
      title: "A little context, then straight to your dashboard.",
      lede: "This isn’t a lead form in disguise — the affordability calculator and comparison tool on the other side actually use this.",
      action: submitBuyerOnboarding,
      body: <BuyingFields />,
    },
    selling: {
      eyebrow: "Selling · two minutes",
      title: "Tell us about the home, then straight to your dashboard.",
      lede: "This becomes your prep checklist and the home profile Max works from — nothing here is thrown away.",
      action: submitSellerOnboarding,
      body: <SellingFields />,
    },
    homeowner: {
      eyebrow: "Homeowner · two minutes",
      title: "A little about your home, then straight to My Home.",
      lede: "This sets up your maintenance reminders and mortgage renewal tracking — the stuff worth keeping an eye on.",
      action: submitHomeownerOnboarding,
      body: <HomeownerFields />,
    },
    investing: {
      eyebrow: "Investing · one minute",
      title: "Quick context, then straight to the analyzer.",
      lede: "The property analyzer works the same whether you tell us this or not — this just helps Max understand what you're after.",
      action: submitInvestorOnboarding,
      body: <InvestingFields />,
    },
    exploring: {
      eyebrow: "Just exploring · thirty seconds",
      title: "No forms, no pressure — just a way to stay in touch.",
      lede: "You don't need to know yet whether you're buying, selling, or just curious. Look around, and message Max anytime.",
      action: submitExploringOnboarding,
      body: null,
    },
  }[goal as "buying" | "selling" | "homeowner" | "investing" | "exploring"];

  if (!config) {
    return (
      <div className="flex flex-col flex-1">
        <BrandHeader />
        <main className="flex-1 mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-ink-soft">Unknown goal.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <BrandHeader />
      <main className="flex-1 mx-auto max-w-2xl px-6 py-12 w-full">
        <p className="font-data text-xs tracking-wide uppercase text-ink-faint mb-3">
          {config.eyebrow}
        </p>
        <h1 className="font-display text-3xl font-semibold mb-2">{config.title}</h1>
        <p className="text-ink-soft mb-8">{config.lede}</p>

        <form action={config.action} className="flex flex-col gap-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Your name" name="name" required placeholder="Jordan Lee" />
            <Field label="Email" name="email" type="email" required placeholder="jordan@email.com" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Phone" name="phone" type="tel" placeholder="(416) 555-0100" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink" htmlFor="preferredContactMethod">
                Preferred contact method
              </label>
              <select
                id="preferredContactMethod"
                name="preferredContactMethod"
                className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                defaultValue="email"
              >
                <option value="email">Email</option>
                <option value="phone">Phone call</option>
                <option value="text">Text message</option>
              </select>
            </div>
          </div>

          {config.body}

          <label className="flex items-start gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="consentMarketing"
              className="mt-1 rounded border-line-strong text-accent focus:ring-accent"
            />
            <span>
              I&rsquo;m okay receiving occasional emails from the MAXimize Team about my
              search and the local market. I can opt out anytime.
            </span>
          </label>

          <button
            type="submit"
            className="mt-2 self-start rounded-full bg-accent text-accent-ink px-6 py-3 text-sm font-medium hover:bg-accent-strong transition-colors"
          >
            Take me to my dashboard →
          </button>
        </form>
      </main>
    </div>
  );
}

function BuyingFields() {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Budget — from" name="budgetMin" type="number" placeholder="600000" />
        <Field label="Budget — to" name="budgetMax" type="number" placeholder="850000" />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Preferred area" name="preferredArea" placeholder="Scarborough, Ajax, ..." />
        <SelectField
          label="Timeline"
          name="timeline"
          defaultValue="3-6 months"
          options={["ASAP", "1-3 months", "3-6 months", "6-12 months", "Just researching"]}
        />
      </div>
      <SelectField
        label="Financing status"
        name="financingStatus"
        defaultValue="not_yet"
        options={[
          { value: "pre_approved", label: "Pre-approved" },
          { value: "in_progress", label: "Talking to a lender now" },
          { value: "not_yet", label: "Haven't started yet" },
          { value: "not_sure", label: "Not sure what this means" },
        ]}
      />
    </>
  );
}

function SellingFields() {
  return (
    <>
      <Field label="Property address" name="address" required placeholder="42 Birchmount Rd, Scarborough" />
      <div className="grid sm:grid-cols-2 gap-5">
        <SelectField
          label="Reason for selling"
          name="reasonForSelling"
          defaultValue="Upsizing"
          options={["Upsizing", "Downsizing", "Relocating", "Investment sale", "Other"]}
        />
        <SelectField
          label="Timeline"
          name="timeline"
          defaultValue="3-6 months"
          options={["ASAP", "1-3 months", "3-6 months", "6-12 months", "Just exploring value"]}
        />
      </div>
    </>
  );
}

function HomeownerFields() {
  return (
    <>
      <Field label="Property address" name="address" required placeholder="18 Maple Grove Ave, Ajax" />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Purchase date" name="purchaseDate" type="date" />
        <Field label="Mortgage renewal date" name="mortgageRenewalDate" type="date" />
      </div>
    </>
  );
}

function InvestingFields() {
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      <Field label="Target area" name="targetArea" placeholder="Scarborough, Ajax, ..." />
      <SelectField
        label="Timeline"
        name="timeline"
        defaultValue="3-6 months"
        options={["ASAP", "1-3 months", "3-6 months", "6-12 months", "Just researching"]}
      />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink" htmlFor={name}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const optLabel = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {optLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}
