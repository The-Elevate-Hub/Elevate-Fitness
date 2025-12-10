import { db } from '@/lib/db';
import { formatPrice, formatDate, calculateInfluencerCommission } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

async function getInfluencerDetails(code: string) {
  const influencer = await db.influencer.findUnique({
    where: { code },
    include: {
      orders: {
        where: { status: 'COMPLETED' },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return influencer;
}

export default async function InfluencerDetailsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const influencer = await getInfluencerDetails(code);

  if (!influencer) {
    return (
      <div className="py-12 px-4 text-center">
        <p className="text-muted-foreground">Influencer not found</p>
      </div>
    );
  }

  const totalRevenue = influencer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const commissionEarned = calculateInfluencerCommission(totalRevenue, influencer.commission);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <Link href="/admin/influencers">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Influencers
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold">{influencer.name}</h1>
        <p className="text-muted-foreground mt-1">{influencer.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Code</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{influencer.code}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{influencer.orders.length}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenue Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{formatPrice(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Commission Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{formatPrice(commissionEarned)}</p>
            <p className="text-xs text-muted-foreground mt-1">{influencer.commission}% rate</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {influencer.orders.length > 0 ? (
            <div className="space-y-4">
              {influencer.orders.map((order) => (
                <div key={order.id} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{order.user.name}</p>
                      <p className="text-sm text-muted-foreground">{order.user.email}</p>
                    </div>
                    <p className="text-lg font-bold text-accent">{formatPrice(order.totalAmount)}</p>
                  </div>
                  <div className="space-y-1 mb-2">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-sm text-muted-foreground">
                        {item.product.name}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}