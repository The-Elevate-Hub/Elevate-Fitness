import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { capturePayPalOrder, verifyPayPalWebhook } from '@/lib/stripe';
import { sendOrderConfirmation } from '@/lib/email';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());

    console.log('[PayPal Webhook] Event received:', body.event_type);

    // CRITICAL: Verify webhook authenticity
    const isValid = await verifyPayPalWebhook(headers, body);
    if (!isValid) {
      console.error('[PayPal Webhook] Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    // CRITICAL: Only process when order is APPROVED (customer completed PayPal flow)
    if (body.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = body.resource.id;

      console.log('[PayPal Webhook] Processing approved order:', orderId);

      // Find the order in our database
      const order = await db.order.findFirst({
        where: { stripeSessionId: orderId },
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
        console.error('[PayPal Webhook] Order not found for PayPal ID:', orderId);
        return NextResponse.json({ 
          received: true, 
          warning: 'Order not found' 
        });
      }

      // CRITICAL: Check if already completed
      if (order.status === 'COMPLETED') {
        console.log('[PayPal Webhook] Order already completed:', order.id);
        return NextResponse.json({ 
          received: true, 
          message: 'Order already completed' 
        });
      }

      // CRITICAL: Capture the payment (actually charge the customer)
      let capture;
      try {
        capture = await capturePayPalOrder(orderId);
        console.log('[PayPal Webhook] Payment captured:', orderId);
      } catch (captureError: any) {
        console.error('[PayPal Webhook] Failed to capture payment:', captureError.message);
        
        // Mark order as FAILED
        await db.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        });

        return NextResponse.json({ 
          received: true, 
          error: 'Payment capture failed' 
        });
      }

      // CRITICAL: Verify the captured amount matches expected amount
      const capturedAmount = parseFloat(
        capture.purchase_units[0].payments.captures[0].amount.value
      ) * 100; // Convert to cents

      const expectedAmount = order.totalAmount;

      if (Math.abs(capturedAmount - expectedAmount) > 1) { // Allow 1 cent rounding difference
        console.error('[PayPal Webhook] Amount mismatch!', {
          expected: expectedAmount,
          captured: capturedAmount,
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
          captured: capturedAmount
        });
      }

      // CRITICAL: Verify payment was successful
      const captureStatus = capture.purchase_units[0].payments.captures[0].status;
      if (captureStatus !== 'COMPLETED') {
        console.error('[PayPal Webhook] Payment not completed:', captureStatus);
        
        await db.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        });

        return NextResponse.json({ 
          received: true, 
          error: 'Payment not completed',
          status: captureStatus
        });
      }

      console.log('[PayPal Webhook] Payment verified successfully:', {
        orderId: order.id,
        amount: capturedAmount,
        paypalId: orderId
      });

      // CRITICAL: Use transaction to ensure atomicity
      await db.$transaction(async (tx) => {
        // Mark order as COMPLETED
        await tx.order.update({
          where: { id: order.id },
          data: { 
            status: 'COMPLETED',
            updatedAt: new Date() // Track when payment completed
          },
        });

        console.log('[PayPal Webhook] Order marked as COMPLETED:', order.id);
      });

      // Send confirmation email (non-critical)
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

        console.log('[PayPal Webhook] Confirmation email sent for order:', order.id);
      } catch (emailError) {
        console.error('[PayPal Webhook] Failed to send confirmation email:', emailError);
        // Don't fail webhook just because email failed
      }

      console.log('[PayPal Webhook] Successfully processed order:', order.id);
      return NextResponse.json({ 
        received: true,
        orderId: order.id,
        status: 'completed'
      });
    }

    // Handle order denied/cancelled
    if (body.event_type === 'CHECKOUT.ORDER.VOIDED' || 
        body.event_type === 'PAYMENT.CAPTURE.DENIED' ||
        body.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      
      const orderId = body.resource.id;
      
      const order = await db.order.findFirst({
        where: { stripeSessionId: orderId },
      });

      if (order && order.status === 'PENDING') {
        await db.order.update({
          where: { id: order.id },
          data: { 
            status: body.event_type.includes('REFUNDED') ? 'REFUNDED' : 'FAILED' 
          },
        });

        console.log('[PayPal Webhook] Order marked as FAILED/REFUNDED:', order.id);
      }

      return NextResponse.json({ 
        received: true, 
        message: 'Payment failure event processed' 
      });
    }

    // Log unhandled event types
    console.log('[PayPal Webhook] Unhandled event type:', body.event_type);
    return NextResponse.json({ 
      received: true, 
      message: 'Event type not handled' 
    });

  } catch (error: any) {
    console.error('[PayPal Webhook] Error processing webhook:', error.message);
    return NextResponse.json(
      { error: 'Webhook handler failed', message: error.message },
      { status: 400 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
