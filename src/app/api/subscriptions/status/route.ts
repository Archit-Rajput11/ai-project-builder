import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    // Accept Supabase Bearer token from the Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    let userId: string | null = null;
    let userEmail: string | null = null;

    // 1. Verify Supabase Bearer token (primary method — works with Supabase Auth)
    if (token) {
      const { data: { user }, error: supaErr } = await supabaseAdmin.auth.getUser(token);
      if (user && !supaErr) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    }

    // If no user found from token, reject early
    if (!userId && !userEmail) {
      return NextResponse.json({ isPro: false, reason: "no_user" });
    }

    // 2. Fetch user profile from database using supabaseAdmin (bypasses RLS)
    let dbSub: any = null;

    if (userId) {
      const { data } = await supabaseAdmin
        .from("users")
        .select("is_pro, is_premium, current_period_end, expires_at, premium_expires_at, email")
        .eq("id", userId)
        .maybeSingle();
      if (data) dbSub = data;
    }

    // Fallback: query by email if ID lookup returned nothing
    if (!dbSub && userEmail) {
      const { data } = await supabaseAdmin
        .from("users")
        .select("is_pro, is_premium, current_period_end, expires_at, premium_expires_at, email")
        .eq("email", userEmail)
        .maybeSingle();
      if (data) dbSub = data;
    }

    if (!dbSub) {
      return NextResponse.json({ isPro: false, reason: "no_profile" });
    }

    // 3. Validate pro status
    const isPro = dbSub.is_pro === true || dbSub.is_premium === true;
    if (!isPro) {
      return NextResponse.json({ isPro: false, reason: "not_pro" });
    }

    // 4. Validate expiration (if set)
    const expiryString = dbSub.current_period_end || dbSub.expires_at || dbSub.premium_expires_at;
    const expiryTime = expiryString ? new Date(expiryString).getTime() : null;
    const isNotExpired = expiryTime ? Date.now() < expiryTime : true;

    if (!isNotExpired) {
      return NextResponse.json({ isPro: false, reason: "expired" });
    }

    // 5. Sign a fresh JWT token for the client
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      const expSeconds = expiryTime
        ? Math.floor(expiryTime / 1000)
        : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const freshToken = jwt.sign({ isPro: true, exp: expSeconds }, jwtSecret);
      return NextResponse.json({ isPro: true, token: freshToken });
    }

    return NextResponse.json({ isPro: true });
  } catch (err: any) {
    console.error("Subscription status check error:", err);
    return NextResponse.json({ isPro: false, reason: "error" });
  }
}
