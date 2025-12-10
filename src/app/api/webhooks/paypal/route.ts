import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { capturePayPalOrder, verifyPayPalWebhook } from '@/lib/stripe';
import { sendOrderConfirmation } from '@/lib/email';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());

    const isValid = await verifyPayPalWebhook(headers, body);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    if (body.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = body.resource.id;

      const capture = await capturePayPalOrder(orderId);

      const customData = JSON.parse(
        capture.purchase_units[0].payments.captures[0].custom_id || '{}'
      );

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
        console.error('Order not found for PayPal ID:', orderId);
        return NextResponse.json({ received: true });
      }

      await db.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
      });

      const orderNumber = generateOrderNumber();

      const downloadLinks = order.items.map((item) => ({
        productName: item.product.name,
        downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }));

      try {
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
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }

      console.log('PayPal order completed:', order.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('PayPal webhook error:', error.message);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';