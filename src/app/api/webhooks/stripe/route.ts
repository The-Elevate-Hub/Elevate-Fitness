import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { constructStripeWebhookEvent } from '@/lib/stripe';
import { sendOrderConfirmation } from '@/lib/email';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('[Stripe Webhook] No signature found');
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    );
  }

  try {
    const event = await constructStripeWebhookEvent(body, signature);

    console.log('[Stripe Webhook] Event received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

      console.log('[Stripe Webhook] Processing session:', session.id);

      // CRITICAL: Find the order by session ID
      const order = await db.order.findUnique({
        where: { stripeSessionId: session.id },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        console.error('[Stripe Webhook] Order not found for session:', session.id);
        // Still return success to prevent Stripe from retrying
        return NextResponse.json({ received: true, warning: 'Order not found' });
      }

      // CRITICAL: Check if order is already completed
      if (order.status === 'COMPLETED') {
        console.log('[Stripe Webhook] Order already completed:', order.id);
        return NextResponse.json({ received: true, message: 'Order already completed' });
      }

      // CRITICAL: Verify payment was successful
      if (session.payment_status !== 'paid') {
        console.error('[Stripe Webhook] Payment not completed:', session.payment_status);
        
        // Mark order as FAILED if payment failed
        await db.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        });

        return NextResponse.json({ 
          received: true, 
          warning: 'Payment not completed',
          paymentStatus: session.payment_status 
        });
      }

      // CRITICAL: Double-check the amount matches
      const expectedAmount = order.totalAmount;
      const paidAmount = session.amount_total; // Already in cents

      if (paidAmount !== expectedAmount) {
        console.error('[Stripe Webhook] Amount mismatch!', {
          expected: expectedAmount,
          paid: paidAmount,
          orderId: order.id
        });

        // Mark as FAILED due to amount mismatch
        await db.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        });

        return NextResponse.json({ 
          received: true, 
          error: 'Amount mismatch',
          expected: expectedAmount,
          paid: paidAmount
        });
      }

      console.log('[Stripe Webhook] Payment verified successfully:', {
        orderId: order.id,
        amount: paidAmount,
        session: session.id
      });

      // CRITICAL: Use a transaction to ensure atomicity
      await db.$transaction(async (tx) => {
        // Update order to COMPLETED
        await tx.order.update({
          where: { id: order.id },
          data: { 
            status: 'COMPLETED',
            updatedAt: new Date() // Track when payment completed
          },
        });

        console.log('[Stripe Webhook] Order marked as COMPLETED:', order.id);
      });

      // Send confirmation email (non-critical, don't fail webhook if this fails)
      try {
        const orderNumber = generateOrderNumber();

        const downloadLinks = order.items.map((item) => ({
          productName: item.product.name,
          downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        }));

        await sendOrderConfirmation({
          name: order.user.name,
          email: order.user.email || '',
          orderNumber,
          totalAmount: order.totalAmount,
          products: order.items.map((item) => ({
            name: item.product.name,
            price: item.price,
          })),
          downloadLinks,
        });

        console.log('[Stripe Webhook] Confirmation email sent for order:', order.id);
      } catch (emailError) {
        console.error('[Stripe Webhook] Failed to send confirmation email:', emailError);
        // Don't fail the webhook just because email failed
      }

      console.log('[Stripe Webhook] Successfully processed order:', order.id);
      return NextResponse.json({ 
        received: true, 
        orderId: order.id,
        status: 'completed'
      });
    }

    // Handle payment_intent.succeeded as a backup verification
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      console.log('[Stripe Webhook] Payment intent succeeded:', paymentIntent.id);
      
      // This is a backup - the checkout.session.completed should have already handled it
      return NextResponse.json({ received: true, message: 'Payment intent succeeded' });
    }

    // Handle failed payments
    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object as any;
      const sessionId = event.type === 'checkout.session.expired' ? session.id : session.metadata?.sessionId;

      if (sessionId) {
        const order = await db.order.findUnique({
          where: { stripeSessionId: sessionId },
        });

        if (order && order.status === 'PENDING') {
          await db.order.update({
            where: { id: order.id },
            data: { status: 'FAILED' },
          });

          console.log('[Stripe Webhook] Order marked as FAILED:', order.id);
        }
      }

      return NextResponse.json({ received: true, message: 'Payment failed event processed' });
    }

    // Log unhandled event types
    console.log('[Stripe Webhook] Unhandled event type:', event.type);
    return NextResponse.json({ received: true, message: 'Event type not handled' });

  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing webhook:', error.message);
    return NextResponse.json(
      { error: 'Webhook handler failed', message: error.message },
      { status: 400 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
