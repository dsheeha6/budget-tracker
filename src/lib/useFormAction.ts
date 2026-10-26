"use client";

import { startTransition, useActionState } from "react";

// Wraps a Server Action that returns { error } for use in a form.
// Submitting through onSubmit (instead of <form action>) means React doesn't
// clear the inputs when the action returns an error, so nothing is lost.
export function useFormAction<State>(
  action: (prev: Awaited<State>, formData: FormData) => Promise<State>,
  initial: Awaited<State>,
) {
  const [state, dispatch, pending] = useActionState<State, FormData>(action, initial);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return { state, pending, onSubmit };
}
