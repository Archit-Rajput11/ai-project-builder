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
    const expiryString = dbSub.expires_at || dbSub.premium_expires_at;
    
    if (!expiryString || !isPro) {
      return NextResponse.json({ isPro: false });
    }

    // Check if subscription has expired
    const expiresAt = new Date(expiryString).getTime();
    const currentTime = Date.now();

    if (isPro && currentTime < expiresAt) {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        // Sign a fresh token valid until the database expiry timestamp
        const expSeconds = Math.floor(expiresAt / 1000);
        const token = jwt.sign(
          {
            isPro: true,
            exp: expSeconds,
          },
          jwtSecret
        );

        return NextResponse.json({ isPro: true, token });
      }
    }

    return NextResponse.json({ isPro: false });
  } catch (err: any) {
    console.error("Subscription status check error:", err);
    return NextResponse.json({ isPro: false });
  }
}
