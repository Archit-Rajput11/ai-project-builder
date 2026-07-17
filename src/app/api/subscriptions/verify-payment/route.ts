import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";

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

    // 2. Generate a secure, signed JWT token valid for exactly 30 days
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
