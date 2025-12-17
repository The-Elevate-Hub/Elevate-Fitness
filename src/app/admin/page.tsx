import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardStats } from '@/components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Package, ShoppingBag, Megaphone, Download as DownloadIcon } from 'lucide-react';
import { db } from '@/lib/db';

export const revalidate = 0;

async function getAnalytics() {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const totalOrders = await db.order.count({
      where: { status: 'COMPLETED' },
    });

    const totalRevenue = await db.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true },
    });

    const totalCustomers = await db.user.count({
      where: { role: 'CUSTOMER' },
    });

    const currentMonthRevenue = await db.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: currentMonth },
      },
      _sum: { totalAmount: true },
    });

    const lastMonthRevenue = await db.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: lastMonth, lt: currentMonth },
      },
      _sum: { totalAmount: true },
    });

    const lastMonthOrders = await db.order.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: lastMonth, lt: currentMonth },
      },
    });

    const currentMonthOrders = await db.order.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: currentMonth },
      },
    });

    const revenueGrowth = lastMonthRevenue._sum.totalAmount
      ? ((((currentMonthRevenue._sum.totalAmount || 0) - (lastMonthRevenue._sum.totalAmount || 0)) /
          (lastMonthRevenue._sum.totalAmount || 1)) * 100)
      : 0;

    const ordersGrowth = lastMonthOrders
      ? (((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : 0;

    const topProducts = await db.orderItem.groupBy({
      by: ['productId'],
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
        });
        return {
          id: item.productId,
          name: product?.name || 'Unknown',
          sales: item._count.id,
          revenue: item._sum.price || 0,
        };
      })
    );

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return date;
    }).reverse();

    const revenueByMonth = await Promise.all(
      last6Months.map(async (month) => {
        const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
        const revenue = await db.order.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: month, lt: nextMonth },
          },
          _sum: { totalAmount: true },
        });

        return {
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: revenue._sum.totalAmount || 0,
        };
      })
    );

    // Get influencer earnings
    const influencers = await db.influencer.findMany({
      include: {
        orders: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    const influencerEarnings = influencers.map((influencer) => {
      const totalRevenue = influencer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const commission = Math.floor((totalRevenue * influencer.commission) / 100);
      
      return {
        code: influencer.code,
        name: influencer.name,
        email: influencer.email,
        orders: influencer.orders.length,
        totalRevenue,
        commissionRate: influencer.commission,
        commissionEarned: commission,
        active: influencer.active,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      totalCustomers,
      monthlyRevenue: currentMonthRevenue._sum.totalAmount || 0,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      ordersGrowth: Math.round(ordersGrowth * 10) / 10,
      customersGrowth: 0,
      topProducts: topProductsWithDetails,
      revenueByMonth,
      influencerEarnings,
    };
  } catch (error) {
    console.error('Analytics error:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0,
      ordersGrowth: 0,
      customersGrowth: 0,
      topProducts: [],
      revenueByMonth: [],
      influencerEarnings: [],
    };
  }
}

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const analytics = await getAnalytics();

  const quickActions = [
    { label: 'Add Product', href: '/admin/products/new', icon: Plus },
    { label: 'View Products', href: '/admin/products', icon: Package },
    { label: 'View Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Influencers', href: '/admin/influencers', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Hemansh</p>
          </div>
          <div className="flex gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <DashboardStats
          totalRevenue={analytics.totalRevenue}
          totalOrders={analytics.totalOrders}
          totalCustomers={analytics.totalCustomers}
          monthlyRevenue={analytics.monthlyRevenue}
          revenueGrowth={analytics.revenueGrowth}
          ordersGrowth={analytics.ordersGrowth}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topProducts.map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                      </div>
                    </div>
                    <p className="font-bold text-accent">{formatPrice(product.revenue)}</p>
                  </div>
                ))}
                {analytics.topProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No sales yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.revenueByMonth.map((item: any) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.month}</span>
                    <span className="font-semibold text-accent">
                      {formatPrice(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Influencer Earnings</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track how much each influencer has earned
              </p>
            </div>
            <div className="flex gap-2">
              <a 
                href="/api/influencers/report" 
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <DownloadIcon className="h-4 w-4" />
                  Export Report
                </Button>
              </a>
              <Link href="/admin/influencers">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {analytics.influencerEarnings && analytics.influencerEarnings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Influencer
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        Code
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        Orders
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Revenue Generated
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        Commission Rate
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        💰 You Owe Them
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.influencerEarnings.map((influencer: any) => (
                      <tr key={influencer.code} className="border-b border-white/10 hover:bg-muted/20">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium">{influencer.name}</p>
                            <p className="text-xs text-muted-foreground">{influencer.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                            {influencer.code}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-medium">
                          {influencer.orders}
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          {formatPrice(influencer.totalRevenue)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm font-medium">{influencer.commissionRate}%</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-lg font-bold text-green-500">
                            {formatPrice(influencer.commissionEarned)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-accent/5">
                      <td colSpan={3} className="py-4 px-4 font-bold">
                        TOTAL TO PAY ALL INFLUENCERS:
                      </td>
                      <td className="py-4 px-4 text-right font-bold">
                        {formatPrice(
                          analytics.influencerEarnings.reduce(
                            (sum: number, inf: any) => sum + inf.totalRevenue,
                            0
                          )
                        )}
                      </td>
                      <td className="py-4 px-4"></td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-2xl font-bold text-green-500">
                          {formatPrice(
                            analytics.influencerEarnings.reduce(
                              (sum: number, inf: any) => sum + inf.commissionEarned,
                              0
                            )
                          )}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No influencer sales yet</p>
                <p className="text-sm text-muted-foreground">
                  Orders with influencer codes will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}