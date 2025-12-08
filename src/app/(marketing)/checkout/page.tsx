'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [influencerCode, setInfluencerCode] = useState('');

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
            'Proceed to Payment'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-6">
          You'll be redirected to Stripe for secure payment processing
        </p>
      </div>
    </div>
  );
}