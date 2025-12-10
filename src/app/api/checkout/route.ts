import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createStripeCheckoutSession, createPayPalOrder } from '@/lib/stripe';
import { z } from 'zod';

const checkoutSchema = z.object({
  productIds: z.array(z.string()).min(1),
  influencerCode: z.string().optional(),
  paymentMethod: z.enum(['stripe', 'paypal']).default('stripe'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { productIds, influencerCode, paymentMethod } = checkoutSchema.parse(body);

    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      );
    }

    let influencer = null;
    if (influencerCode) {
      influencer = await db.influencer.findUnique({
        where: { code: influencerCode, active: true },
      });
    }

    const totalAmount = products.reduce((sum, p) => sum + p.price, 0);

    const order = await db.order.create({
      data: {
        userId: session.userId,
        totalAmount,
        status: 'PENDING',
        influencerCode: influencer?.code,
        items: {
          create: products.map((product) => ({
            productId: product.id,
            price: product.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (paymentMethod === 'paypal') {
      const paypalOrder = await createPayPalOrder({
        userId: session.userId,
        items: products.map((p) => ({
          productId: p.id,
          name: p.name,
          price: p.price,
        })),
        influencerCode: influencer?.code,
      });

      await db.order.update({
        where: { id: order.id },
        data: { stripeSessionId: paypalOrder.id },
      });

      const approvalUrl = paypalOrder.links?.find((link: any) => link.rel === 'approve')?.href;

      return NextResponse.json({
        orderId: paypalOrder.id,
        url: approvalUrl,
        method: 'paypal',
      });
    } else {
      const stripeSession = await createStripeCheckoutSession({
        userId: session.userId,
        email: session.email || '',
        items: products.map((p) => ({
          productId: p.id,
          name: p.name,
          price: p.price,
        })),
        influencerCode: influencer?.code,
      });

      await db.order.update({
        where: { id: order.id },
        data: { stripeSessionId: stripeSession.id },
      });

      return NextResponse.json({
        sessionId: stripeSession.id,
        url: stripeSession.url,
        method: 'stripe',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}