import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "../../../../utils/supabase";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ isPro: false });
    }

    const isSupabaseConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-supabase-project.supabase.co" &&
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({ isPro: false });
    }

    const { data: dbSub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_email", userEmail)
      .single();

    if (error || !dbSub) {
      return NextResponse.json({ isPro: false });
    }

    // Check if subscription has expired
    const expiresAt = new Date(dbSub.expires_at).getTime();
    const currentTime = Date.now();

    if (dbSub.is_pro && currentTime < expiresAt) {
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
