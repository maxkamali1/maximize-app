"use client";

import { useTransition } from "react";

export function ToggleCheckbox({
  action,
  checked,
  label,
}: {
  action: () => Promise<void>;
  checked: boolean;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <label
      className={`flex items-center gap-2.5 text-sm cursor-pointer transition-opacity ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => startTransition(action)}
        disabled={isPending}
        className="rounded border-line-strong text-accent focus:ring-accent"
      />
      <span className={checked ? "text-ink-faint line-through" : "text-ink"}>{label}</span>
    </label>
  );
}
