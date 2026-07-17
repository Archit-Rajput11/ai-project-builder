import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "../../../../utils/supabase";

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const jwtSecret = process.env.JWT_SECRET;

  if (!keySecret || !jwtSecret) {
    console.error("Razorpay or JWT environment variables are missing");
    return NextResponse.json(
      { error: "Server credentials are not configured." },
      { status: 500 }
    );
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required Razorpay payment parameters." },
        { status: 400 }
      );
    }

    // 1. Verify Razorpay Payment Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature verification failed." },
        { status: 400 }
      );
    }

    // 2. Fetch logged-in user email session
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first to associate purchase." },
        { status: 401 }
      );
    }

    // 3. Save/Upsert subscription record in Supabase
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const isSupabaseConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-supabase-project.supabase.co" &&
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (isSupabaseConfigured) {
      const { error: dbError } = await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            user_email: userEmail,
            is_pro: true,
            expires_at: expiresAt,
          },
          { onConflict: "user_email" }
        );

      if (dbError) {
        console.error("Supabase subscription storage error:", dbError.message);
      } else {
        console.log(`Supabase subscription persisted for ${userEmail}`);
      }
    } else {
      console.warn("Supabase is not configured yet. Subscription persisted on client only.");
    }

    // 4. Generate a secure, signed JWT token valid for exactly 30 days
    const expTime = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days in seconds
    const token = jwt.sign(
      {
        isPro: true,
        exp: expTime,
      },
      jwtSecret
    );

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      token,
    });
  } catch (error: any) {
    console.error("Error verifying payment and signing JWT:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
