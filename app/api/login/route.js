import { NextResponse } from "next/server";
import { createServerSupabaseClientAsync } from "@/utils/supabase/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const supabase = await createServerSupabaseClientAsync();

    const {
      data: { user, session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ✅ Create response and attach cookies directly
    const res = NextResponse.json({ user });

    if (session) {
      res.cookies.set("sb-access-token", session.access_token, {
        httpOnly: true,
        secure: true,
        path: "/",
      });
      res.cookies.set("sb-refresh-token", session.refresh_token, {
        httpOnly: true,
        secure: true,
        path: "/",
      });
    }

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
