import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    // 1. Get the raw body text and Razorpay signature for verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
    }

    // 2. Cryptographically verify that this request actually came from Razorpay
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Parse the verified event data
    const eventData = JSON.parse(rawBody);
    const event = eventData.event;

    console.log(`✅ Validated Razorpay Webhook Event: ${event}`);

    // 4. Handle successful payments
    if (event === 'payment.captured' || event === 'subscription.charged') {
      const payment = eventData.payload.payment?.entity || eventData.payload.subscription?.entity;
      
      // Razorpay lets you pass data (like userId and email) inside notes when creating orders/subscriptions
      const targetUserId = payment.notes?.userId;
      const targetUserEmail = payment.notes?.email || 'no-email@provided.com';

      if (!targetUserId) {
        return new Response("Missing user ID note metadata", { status: 400 });
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30); 

      // FIX: Changing this block to .upsert() fixes ALL accounts instantly
      const { error } = await supabaseAdmin
        .from('users')
        .upsert({
          id: targetUserId,          // This links to the UID from Screenshot 138
          email: targetUserEmail,    // This adds the email automatically
          is_pro: true,
          current_period_end: expirationDate.toISOString()
        }, { onConflict: 'id' });    // Tells Supabase to match up using the ID column

      if (error) {
        console.error("Webhook Database Error:", error.message);
        return new Response(`Error: ${error.message}`, { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // 5. Handle failed or canceled cycles
    if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      const subscription = eventData.payload.subscription.entity;
      const userId = subscription.notes?.userId;

      if (userId) {
        await supabaseAdmin
          .from('users')
          .update({ is_pro: false })
          .eq('id', userId);
      }
      return NextResponse.json({ status: 'Success', message: 'Subscription revoked' });
    }

    return NextResponse.json({ status: 'Ignored', message: 'Unhandled event type' });

  } catch (err: any) {
    console.error('❌ Webhook Error:', err.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
