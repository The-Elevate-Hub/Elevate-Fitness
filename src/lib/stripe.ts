import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export async function createCheckoutSession({
  userId,
  email,
  items,
  influencerCode,
}: {
  userId: string;
  email: string;
  items: Array<{ productId: string; name: string; price: number }>;
  influencerCode?: string;
}) {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price,
      },
      quantity: 1,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products?canceled=true`,
    metadata: {
      userId,
      productIds: items.map((i) => i.productId).join(','),
      influencerCode: influencerCode || '',
    },
  });

  return session;
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}