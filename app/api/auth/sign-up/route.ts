import { createClient } from "@/lib/db/server";
import { createUser } from "@/lib/db/queries/users";
import { NextResponse } from "next/server";
import { defaultUrl } from "@/constants";
export async function POST(req: Request) {
  let stage = "reading request";
  try {
    const { email, password } = await req.json();
    stage = "creating Supabase client";
    const supabase = await createClient();
    stage = "signing up with Supabase Auth";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${defaultUrl}/api/auth/confirm`,
      },
    });
    if (error) {
      return NextResponse.json({ error: error.message, stage }, { status: 400 });
    }
    const user = data.user;
    if (user?.email) {
      stage = "creating app user in public.users";
      await createUser(user.id, user.email);
    }
    return NextResponse.json({
      message: "Sign-up request completed. Check your email if confirmation is enabled.",
    });
  } catch (err) {
    console.error(`Sign-up exception at stage "${stage}":`);
    console.dir(err, { depth: 5 });
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null
          ? JSON.stringify(err)
          : String(err);
    return NextResponse.json({ error: message, stage }, { status: 500 });
  }
}