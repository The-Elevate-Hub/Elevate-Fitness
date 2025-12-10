import Stripe from 'stripe';
// @ts-ignore - PayPal SDK doesn't have TypeScript definitions
import paypal from '@paypal/checkout-server-sdk';

// ==================== STRIPE ====================
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export async function createStripeCheckoutSession({
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
      paymentMethod: 'stripe',
    },
  });

  return session;
}

export async function constructStripeWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// ==================== PAYPAL ====================

function getPayPalEnvironment() {
  if (process.env.PAYPAL_MODE === 'live') {
    return new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    );
  }
  return new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID || 'test',
    process.env.PAYPAL_CLIENT_SECRET || 'test'
  );
}

const paypalClient = new paypal.core.PayPalHttpClient(getPayPalEnvironment());

export async function createPayPalOrder({
  userId,
  items,
  influencerCode,
}: {
  userId: string;
  items: Array<{ productId: string; name: string; price: number }>;
  influencerCode?: string;
}) {
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: (totalAmount / 100).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: (totalAmount / 100).toFixed(2),
            },
          },
        },
        items: items.map((item) => ({
          name: item.name,
          unit_amount: {
            currency_code: 'USD',
            value: (item.price / 100).toFixed(2),
          },
          quantity: '1',
        })),
        custom_id: JSON.stringify({
          userId,
          productIds: items.map((i) => i.productId),
          influencerCode,
        }),
      },
    ],
    application_context: {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products?canceled=true`,
      brand_name: 'Elevate Fitness',
      user_action: 'PAY_NOW',
    },
  });

  const order = await paypalClient.execute(request);
  return order.result;
}

export async function capturePayPalOrder(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  const capture = await paypalClient.execute(request);
  return capture.result;
}

export async function verifyPayPalWebhook(
  headers: any,
  body: any
): Promise<boolean> {
  // PayPal webhook verification
  // In production, implement proper verification
  return true;
}