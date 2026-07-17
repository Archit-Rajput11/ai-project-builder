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
      const userId = payment.notes?.userId;
      const email = payment.notes?.email;
      const idToTrack = payment.order_id || payment.id;

      if (!userId) {
        return NextResponse.json({ error: 'No userId found in payment notes' }, { status: 400 });
      }

      // Calculate exactly 30 days out from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Upsert the user into Supabase to grant access (uses admin client to bypass RLS)
      const { error } = await supabaseAdmin.from('users').upsert({
        id: userId,
        email: email || 'no-email@provided.com',
        is_pro: true,
        razorpay_subscription_id: idToTrack,
        current_period_end: expiryDate.toISOString(),
      });

      if (error) throw error;
      
      return NextResponse.json({ status: 'Success', message: 'User upgraded to Pro' });
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
