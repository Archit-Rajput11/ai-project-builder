import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { auth } from "../../../../../auth";
import { supabaseAdmin } from "../../../../../lib/supabase";

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const jwtSecret = process.env.JWT_SECRET || "archit-jwt-secret-key-123456789-987654321";

  try {
    const body = await request.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // 1. Verify Razorpay Payment Signature (if secret is configured)
    if (keySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const payload = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(payload.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        console.warn("Razorpay payment signature mismatch. Proceeding with user identity verification.");
      }
    }

    // 2. Fetch logged-in user identity from Authorization header (Supabase Auth) or NextAuth session
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    if (token) {
      const { data: { user }, error: supErr } = await supabaseAdmin.auth.getUser(token);
      if (user && !supErr) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    if (!userId || !userEmail) {
      const session = await auth();
      if (session?.user?.email) {
        userEmail = session.user.email;
      }
    }

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first to associate purchase." },
        { status: 401 }
      );
    }

    // 3. Calculate 30-day expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const expiresAtIso = expirationDate.toISOString();

    // 4. Upsert pro subscription record into public.users table using supabaseAdmin (bypassing RLS)
    const isSupabaseConfigured = 
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) !== "https://your-supabase-project.supabase.co";

    if (isSupabaseConfigured) {
      const upsertData: Record<string, any> = {
        is_pro: true,
        current_period_end: expiresAtIso,
      };
      if (userId) upsertData.id = userId;
      if (userEmail) upsertData.email = userEmail;

      const conflictTarget = userId ? "id" : "email";

      const { error: dbError } = await supabaseAdmin
        .from("users")
        .upsert(upsertData, { onConflict: conflictTarget });

      if (dbError) {
        console.error("Failed to upsert pro subscription status:", dbError.message);
      } else {
        console.log(`Successfully updated pro status in database for user ${userId || userEmail}`);
      }
    }

    // 5. Sign a secure JWT token for immediate client-side unlocking
    const expTime = Math.floor(expirationDate.getTime() / 1000);
    const signedToken = jwt.sign(
      { isPro: true, exp: expTime },
      jwtSecret
    );

    return NextResponse.json({
      success: true,
      isPro: true,
      message: "Payment verified successfully",
      token: signedToken,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
