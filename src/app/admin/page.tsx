import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardStats } from '@/components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Package, ShoppingBag, Megaphone, Download as DownloadIcon, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/db';

export const revalidate = 0;

async function getAnalytics() {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // CRITICAL FIX: Only count COMPLETED orders (actual successful payments)
    const totalOrders = await db.order.count({
      where: { 
        status: 'COMPLETED',
        // Additional safety: ensure we have a payment session ID
        stripeSessionId: { not: null }
      },
    });

    // CRITICAL FIX: Only sum revenue from COMPLETED orders
    const totalRevenue = await db.order.aggregate({
      where: { 
        status: 'COMPLETED',
        stripeSessionId: { not: null }
      },
      _sum: { totalAmount: true },
    });

    const totalCustomers = await db.user.count({
      where: { role: 'CUSTOMER' },
    });

    // CRITICAL FIX: Current month - only COMPLETED orders
    const currentMonthRevenue = await db.order.aggregate({
      where: {
        status: 'COMPLETED',
        stripeSessionId: { not: null },
        createdAt: { gte: currentMonth },
      },
      _sum: { totalAmount: true },
    });

    const currentMonthOrders = await db.order.count({
      where: {
        status: 'COMPLETED',
        stripeSessionId: { not: null },
        createdAt: { gte: currentMonth },
      },
    });

    // CRITICAL FIX: Last month - only COMPLETED orders
    const lastMonthRevenue = await db.order.aggregate({
      where: {
        status: 'COMPLETED',
        stripeSessionId: { not: null },
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
      _sum: { totalAmount: true },
    });

    const lastMonthOrders = await db.order.count({
      where: {
        status: 'COMPLETED',
        stripeSessionId: { not: null },
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
    });

    // Calculate growth safely
    const revenueGrowth = lastMonthRevenue._sum.totalAmount
      ? ((((currentMonthRevenue._sum.totalAmount || 0) - (lastMonthRevenue._sum.totalAmount || 0)) /
          (lastMonthRevenue._sum.totalAmount || 1)) * 100)
      : 0;

    const ordersGrowth = lastMonthOrders
      ? (((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : 0;

    // CRITICAL FIX: Top products - only from COMPLETED orders
    const topProducts = await db.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: 'COMPLETED',
          stripeSessionId: { not: null }
        }
      },
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

    // Revenue by month - last 6 months
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
            stripeSessionId: { not: null },
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

    // CRITICAL FIX: Influencer earnings - ONLY from COMPLETED orders with verification
    const influencers = await db.influencer.findMany({
      include: {
        orders: {
          where: { 
            status: 'COMPLETED',
            stripeSessionId: { not: null },
            // Ensure influencer code is actually set
            influencerCode: { not: null }
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
      },
    });

    const influencerEarnings = influencers.map((influencer) => {
      // Calculate total revenue from COMPLETED orders only
      const totalRevenue = influencer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // CRITICAL: Commission calculation with precision
      // Use Math.floor to avoid paying extra cents
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
        // Add payment verification data
        lastOrderDate: influencer.orders.length > 0 
          ? influencer.orders[influencer.orders.length - 1].createdAt 
          : null,
        // List all order IDs for audit trail
        orderIds: influencer.orders.map(o => o.id),
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // CRITICAL: Calculate total owed to ALL influencers with verification
    const totalInfluencerCommissions = influencerEarnings.reduce(
      (sum, inf) => sum + inf.commissionEarned,
      0
    );

    // CRITICAL: Detect any orphaned PENDING orders (potential data integrity issues)
    const pendingOrdersCount = await db.order.count({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // More than 24 hours old
        }
      }
    });

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
      totalInfluencerCommissions,
      // Data quality metrics
      dataQuality: {
        pendingOrdersCount,
        hasDataIssues: pendingOrdersCount > 0,
      }
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
      totalInfluencerCommissions: 0,
      dataQuality: {
        pendingOrdersCount: 0,
        hasDataIssues: false,
      }
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

        {/* Data Quality Warning */}
        {analytics.dataQuality.hasDataIssues && (
          <Card className="border-yellow-500/50 bg-yellow-500/10 mb-8">
            <CardContent className="flex items-start gap-4 p-6">
              <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-500 mb-2">Data Quality Alert</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Found {analytics.dataQuality.pendingOrdersCount} pending order(s) older than 24 hours. 
                  These may be abandoned checkouts and should be reviewed.
                </p>
                <Link href="/admin/orders?status=pending">
                  <Button variant="outline" size="sm">
                    Review Pending Orders
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* ENHANCED Influencer Earnings Table */}
        <Card className="border-white/10 mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>💰 Influencer Commission Report</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                VERIFIED - Based on COMPLETED orders only • Updated in real-time
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
              <>
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
                          Completed Orders
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          Revenue Generated
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                          Commission %
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                          💰 Amount Owed
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
                              {influencer.lastOrderDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last sale: {new Date(influencer.lastOrderDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                              {influencer.code}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-medium text-lg">{influencer.orders}</span>
                            <p className="text-xs text-muted-foreground">verified</p>
                          </td>
                          <td className="py-4 px-4 text-right font-medium">
                            {formatPrice(influencer.totalRevenue)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm font-medium">{influencer.commissionRate}%</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="text-right">
                              <span className="text-xl font-bold text-green-500">
                                {formatPrice(influencer.commissionEarned)}
                              </span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {influencer.orders} order{influencer.orders !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {/* TOTAL ROW */}
                      <tr className="bg-accent/5 border-t-2 border-accent/20">
                        <td colSpan={3} className="py-4 px-4">
                          <div className="font-bold text-lg">
                            TOTAL COMMISSION OWED:
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            This is the exact amount you need to pay all influencers
                          </p>
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
                          <span className="text-3xl font-bold text-green-500">
                            {formatPrice(analytics.totalInfluencerCommissions)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Commission Summary */}
                <div className="mt-6 p-6 bg-muted/30 rounded-lg border border-accent/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Your Net Revenue</p>
                      <p className="text-2xl font-bold text-accent">
                        {formatPrice(analytics.totalRevenue - analytics.totalInfluencerCommissions)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        After influencer commissions
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Commissions</p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatPrice(analytics.totalInfluencerCommissions)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((analytics.totalInfluencerCommissions / Math.max(analytics.totalRevenue, 1)) * 100).toFixed(1)}% of total revenue
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Gross Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(analytics.totalRevenue)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        From {analytics.totalOrders} completed order{analytics.totalOrders !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No influencer sales yet</p>
                <p className="text-sm text-muted-foreground">
                  Orders with influencer codes will appear here once completed
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
