import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "../../../../../lib/supabase";

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

    // 3. Save/Upsert premium subscription record in Supabase users table
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const isSupabaseConfigured = 
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) !== "https://your-supabase-project.supabase.co";

    if (isSupabaseConfigured) {
      // Schema A fallback logic: try writing standard is_pro & expires_at fields first
      const { error: dbError } = await supabaseAdmin
        .from("users")
        .upsert(
          {
            email: userEmail,
            is_pro: true,
            expires_at: expiresAt,
          },
          { onConflict: "email" }
        );

      if (dbError) {
        console.warn("Supabase users table Schema A write failed, retrying with Schema B:", dbError.message);
        
        // Schema B fallback: try writing email, is_premium, premium_expires_at
        const { error: retryError } = await supabaseAdmin
          .from("users")
          .upsert(
            {
              email: userEmail,
              is_premium: true,
              premium_expires_at: expiresAt,
            },
            { onConflict: "email" }
          );

        if (retryError) {
          console.error("Supabase alternative write error:", retryError.message);
        } else {
          console.log(`Supabase users table persisted (Schema B) for ${userEmail}`);
        }
      } else {
        console.log(`Supabase users table persisted (Schema A) for ${userEmail}`);
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
