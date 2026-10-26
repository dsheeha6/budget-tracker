"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Two steps: enter email → enter the code from the email.
// A code (instead of only a magic link) matters on iPhone: tapping a link
// opens Safari, not the home-screen app, so the app would stay logged out.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <h1 className="text-3xl font-bold">Budget</h1>
      <p className="mt-1 text-zinc-500">Sign in with your email. No password needed.</p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-8 space-y-3">
          <p className="text-sm text-zinc-500">
            We sent a code to <span className="font-medium text-zinc-800 dark:text-zinc-200">{email}</span>.
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            pattern="[0-9]{6,10}"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="input text-center text-2xl tracking-widest"
          />
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
            }}
            className="w-full py-2 text-sm text-zinc-500"
          >
            Use a different email
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
