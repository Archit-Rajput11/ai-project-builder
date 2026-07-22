import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "../../../../../lib/supabase";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ isPro: false });
    }

    const isSupabaseConfigured = 
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) !== "https://your-supabase-project.supabase.co";

    if (!isSupabaseConfigured) {
      return NextResponse.json({ isPro: false });
    }

    const { data: dbSub, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", userEmail)
      .single();

    if (error || !dbSub) {
      return NextResponse.json({ isPro: false });
    }

    // Support both standard is_pro/expires_at and is_premium/premium_expires_at schemas
    const isPro = dbSub.is_pro || dbSub.is_premium;
    const expiryString = dbSub.current_period_end || dbSub.expires_at || dbSub.premium_expires_at;
    
    if (!isPro) {
      return NextResponse.json({ isPro: false });
    }

    // Check if subscription has expired (if expiry date is set)
    const expiryTime = expiryString ? new Date(expiryString).getTime() : null;
    const currentTime = Date.now();
    const isNotExpired = expiryTime ? currentTime < expiryTime : true;

    if (isPro && isNotExpired) {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        // Sign a fresh token valid until the database expiry timestamp (default to 30 days if no expiry time)
        const expSeconds = expiryTime ? Math.floor(expiryTime / 1000) : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        const token = jwt.sign(
          {
            isPro: true,
            exp: expSeconds,
          },
          jwtSecret
        );

        return NextResponse.json({ isPro: true, token });
      }
      return NextResponse.json({ isPro: true });
    }

    return NextResponse.json({ isPro: false });
  } catch (err: any) {
    console.error("Subscription status check error:", err);
    return NextResponse.json({ isPro: false });
  }
}
