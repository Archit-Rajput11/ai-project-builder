import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    // Accept Supabase Bearer token from the Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-project.supabase.co";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const hasServiceRoleKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("your-supabase-service-role"));

    // Scoped client: uses service role if present, or user's Bearer token to satisfy RLS
    const dbClient = hasServiceRoleKey
      ? supabaseAdmin
      : createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        });

    let userId: string | null = null;
    let userEmail: string | null = null;

    // 1. Verify Supabase Bearer token (primary method — works with Supabase Auth)
    if (token) {
      const { data: { user }, error: supaErr } = await dbClient.auth.getUser(token);
      if (user && !supaErr) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    }

    // If no user found from token, reject early
    if (!userId && !userEmail) {
      return NextResponse.json({ isPro: false, reason: "no_user" });
    }

    // 2. Fetch all user profile rows matching this user's ID or Email (handles multiple rows per account)
    let profiles: any[] = [];
    if (userId && userEmail) {
      const { data } = await dbClient
        .from("users")
        .select("id, email, is_pro, is_premium, current_period_end, expires_at, premium_expires_at")
        .or(`id.eq.${userId},email.eq.${userEmail}`);
      if (data) profiles = data;
    } else if (userId) {
      const { data } = await dbClient
        .from("users")
        .select("id, email, is_pro, is_premium, current_period_end, expires_at, premium_expires_at")
        .eq("id", userId);
      if (data) profiles = data;
    } else if (userEmail) {
      const { data } = await dbClient
        .from("users")
        .select("id, email, is_pro, is_premium, current_period_end, expires_at, premium_expires_at")
        .eq("email", userEmail);
      if (data) profiles = data;
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ isPro: false, reason: "no_profile" });
    }

    // 3. Find if ANY matching row indicates active Pro status
    const activeProProfile = profiles.find((p) => {
      const isPro = p.is_pro === true || p.is_premium === true || String(p.is_pro) === "true";
      if (!isPro) return false;
      const expiryString = p.current_period_end || p.expires_at || p.premium_expires_at;
      if (!expiryString) return true;
      return new Date(expiryString).getTime() > Date.now();
    });

    if (!activeProProfile) {
      return NextResponse.json({ isPro: false, reason: "not_pro", checkedRows: profiles.length });
    }

    // 4. Auto-heal: If an active pro profile was found under their email, sync the user's main ID row to also be Pro
    if (userId && activeProProfile.id !== userId) {
      try {
        const expiryToSync = activeProProfile.current_period_end || activeProProfile.expires_at || activeProProfile.premium_expires_at;
        await dbClient
          .from("users")
          .upsert({
            id: userId,
            email: userEmail,
            is_pro: true,
            current_period_end: expiryToSync || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: "id" });
      } catch (syncErr) {
        console.error("Failed to auto-heal pro status to user ID:", syncErr);
      }
    }

    // 5. Sign a fresh JWT token for the client
    const jwtSecret = process.env.JWT_SECRET || "archit-jwt-secret-key-123456789-987654321";
    const expiryString = activeProProfile.current_period_end || activeProProfile.expires_at || activeProProfile.premium_expires_at;
    const expiryTime = expiryString ? new Date(expiryString).getTime() : null;
    const expSeconds = expiryTime
      ? Math.floor(expiryTime / 1000)
      : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
    
    const freshToken = jwt.sign({ isPro: true, exp: expSeconds }, jwtSecret);
    return NextResponse.json({ isPro: true, token: freshToken });
  } catch (err: any) {
    console.error("Subscription status check error:", err);
    return NextResponse.json({ isPro: false, reason: "error", message: err.message });
  }
}
