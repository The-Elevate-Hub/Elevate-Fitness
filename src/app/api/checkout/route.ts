import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { z } from 'zod';

const checkoutSchema = z.object({
  productIds: z.array(z.string()).min(1),
  influencerCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { productIds, influencerCode } = checkoutSchema.parse(body);

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

    const stripeSession = await createCheckoutSession({
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
    });
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