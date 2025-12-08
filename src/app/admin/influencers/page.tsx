import { db } from '@/lib/db';
import { formatPrice, calculateInfluencerCommission } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const revalidate = 0;

async function getInfluencerStats() {
  const influencers = await db.influencer.findMany({
    include: {
      orders: {
        where: { status: 'COMPLETED' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return influencers.map((influencer) => {
    const totalOrders = influencer.orders.length;
    const totalRevenue = influencer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const commissionEarned = calculateInfluencerCommission(totalRevenue, influencer.commission);

    return {
      ...influencer,
      totalOrders,
      totalRevenue,
      commissionEarned,
    };
  });
}

export default async function AdminInfluencersPage() {
  const influencers = await getInfluencerStats();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold">Influencers</h1>
        <p className="text-muted-foreground mt-1">Manage influencer partnerships and track performance</p>
      </div>

      <div className="grid gap-6">
        {influencers.map((influencer) => (
          <Card key={influencer.id} className="border-white/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{influencer.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{influencer.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-semibold">
                    {influencer.code}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      influencer.active
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {influencer.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-accent">{influencer.totalOrders}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-accent">
                    {formatPrice(influencer.totalRevenue)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Commission Rate</p>
                  <p className="text-2xl font-bold text-accent">{influencer.commission}%</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                  <p className="text-2xl font-bold text-accent">
                    {formatPrice(influencer.commissionEarned)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {influencers.length === 0 && (
          <Card className="border-white/10">
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground">No influencers added yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add influencers via the database seed or admin panel
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}