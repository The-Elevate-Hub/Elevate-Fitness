import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { constructWebhookEvent } from '@/lib/stripe';
import { sendOrderConfirmation } from '@/lib/email';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    );
  }

  try {
    const event = await constructWebhookEvent(body, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

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
        console.error('Order not found for session:', session.id);
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

      console.log('Order completed:', order.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';