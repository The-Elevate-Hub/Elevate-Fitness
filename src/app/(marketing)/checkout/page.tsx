'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [influencerCode, setInfluencerCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  const productId = searchParams.get('product');

  useEffect(() => {
    if (!productId) {
      router.push('/products');
      return;
    }

    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch(() => router.push('/products'));
  }, [productId, router]);

  const handleCheckout = async () => {
    if (!productId) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: [productId],
          influencerCode: influencerCode || undefined,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-serif font-bold text-center mb-8">Checkout</h1>

        <Card className="border-white/10 mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
              <p className="font-bold text-accent">{formatPrice(product.price)}</p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-accent">{formatPrice(product.price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 mb-6">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <CreditCard className="h-8 w-8" />
                  <span className="font-semibold">Stripe</span>
                  <span className="text-xs text-muted-foreground">Credit/Debit Card</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'paypal'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 01-.794.679H7.72a.483.483 0 01-.477-.558L8.926 12.5h.938c4.09 0 6.626-2.06 7.296-6.104.197-1.187.027-2.17-.524-2.917-.14-.189-.3-.36-.478-.517 1.31.473 2.427 1.395 2.91 2.516z"/>
                    <path d="M9.145 3.5h5.72c1.05 0 1.97.076 2.74.26.23.055.448.12.654.197.21.08.408.172.594.277.14.078.27.163.393.256.492.368.87.86 1.128 1.496.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 01-.794.679H7.72a.483.483 0 01-.477-.558l1.644-10.42.77-4.88a.805.805 0 01.794-.68z"/>
                  </svg>
                  <span className="font-semibold">PayPal</span>
                  <span className="text-xs text-muted-foreground">PayPal Account</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 mb-6">
          <CardHeader>
            <CardTitle>Influencer Code (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="influencerCode">
              Have a referral code? Enter it here
            </Label>
            <Input
              id="influencerCode"
              value={influencerCode}
              onChange={(e) => setInfluencerCode(e.target.value.toUpperCase())}
              placeholder="INFLUENCER123"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Support your favorite creator by using their code
            </p>
          </CardContent>
        </Card>

        <Button
          variant="luxury"
          size="xl"
          className="w-full"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {paymentMethod === 'stripe' ? (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay with Stripe
                </>
              ) : (
                'Pay with PayPal'
              )}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Secure payment processing • 256-bit SSL encryption
        </p>
      </div>
    </div>
  );
}