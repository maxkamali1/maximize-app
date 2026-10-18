"use client";

import { useFormStatus } from "react-dom";

// A submit button that locks itself the moment it's pressed, so a double
// click (or an impatient second tap on a phone) can't send the form twice —
// which would create a duplicate lead and a second AI call.
export function SubmitButton({
  children,
  pendingText = "Sending…",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`${className ?? ""} disabled:opacity-60 disabled:cursor-wait`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
