import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// This is the OAuth redirect target. Google redirects to Supabase's own
// callback (https://<project>.supabase.co/auth/v1/callback), and Supabase
// then redirects here with a `code` query param, which we exchange for a
// logged-in session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Send the user to their profile so we can prompt for a name if
      // this is their first sign-in.
      return NextResponse.redirect(`${origin}/profile`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
