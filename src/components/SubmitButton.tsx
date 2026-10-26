"use client";

import { useFormStatus } from "react-dom";

// A submit button that disables itself while its form's Server Action runs.
export default function SubmitButton({
  children,
  pendingText = "Saving…",
  className = "btn-primary w-full",
  formAction,
  confirmMessage,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  confirmMessage?: string;
  /** Pass when the form submits through useActionState instead of `action`. */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button
      type="submit"
      disabled={pending}
      formAction={formAction}
      className={className}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
