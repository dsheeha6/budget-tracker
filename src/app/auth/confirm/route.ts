import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the sign-in link in the email (useful on a computer). Links arrive
// with ?token_hash=...&type=email from a custom template, or ?code=... from
// Supabase's default one.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const supabase = await createClient();

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  }

  // A ?code link only works in the browser that asked for it, and the email may
  // open somewhere else. Sign out whoever is here so the link can't land in a
  // different account, and let them finish with a code.
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
