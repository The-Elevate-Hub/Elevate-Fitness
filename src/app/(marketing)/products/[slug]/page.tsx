import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Download, Award, Clock } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 3600;

interface ProductPageProps {
  params: { slug: string };
}

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
  });
}

async function checkIfUserOwnedProduct(userId: string, productId: string) {
  const order = await db.order.findFirst({
    where: {
      userId,
      status: 'COMPLETED',
      items: {
        some: {
          productId,
        },
      },
    },
  });

  return !!order;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product || !product.active) {
    notFound();
  }

  const session = await getSession();
  let userOwnsProduct = false;

  if (session) {
    userOwnsProduct = await checkIfUserOwnedProduct(session.userId, product.id);
  }

  const handlePurchase = async () => {
    'use server';
    if (!session) {
      redirect('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted mb-6">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <ShoppingBag className="h-32 w-32 text-muted-foreground/30" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Card className="border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-accent" />
                    What's Included
                  </h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-accent" />
                      Instant digital download
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      Lifetime access
                    </li>
                    {product.fileSize && (
                      <li className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-accent" />
                        File size: {product.fileSize}
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-sm text-accent tracking-widest uppercase">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2 mb-4 text-foreground">
                {product.name}
              </h1>
              <p className="text-xl text-muted-foreground">{product.description}</p>
            </div>

            {product.longDesc && (
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.longDesc}
                </p>
              </div>
            )}

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-accent">
                  {formatPrice(product.price)}
                </span>
                <span className="text-muted-foreground">one-time payment</span>
              </div>

              {userOwnsProduct ? (
                <Link href="/dashboard">
                  <Button variant="luxury" size="xl" className="w-full">
                    <Download className="mr-2 h-5 w-5" />
                    Access in Dashboard
                  </Button>
                </Link>
              ) : session ? (
                <form action={handlePurchase}>
                  <Link href={`/checkout?product=${product.id}`}>
                    <Button variant="luxury" size="xl" className="w-full">
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Purchase Now
                    </Button>
                  </Link>
                </form>
              ) : (
                <Link href="/login">
                  <Button variant="luxury" size="xl" className="w-full">
                    Sign In to Purchase
                  </Button>
                </Link>
              )}

              <p className="text-xs text-center text-muted-foreground mt-4">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}