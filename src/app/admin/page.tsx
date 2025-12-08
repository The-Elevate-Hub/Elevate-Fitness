import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardStats } from '@/components/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Package, ShoppingBag, Users, Megaphone } from 'lucide-react';

async function getAnalytics() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics`, {
    cache: 'no-store',
    headers: {
      'Cookie': '',
    },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const analytics = await getAnalytics();

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-muted-foreground">Failed to load analytics</p>
        </div>
      </div>
    );
  }

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
      </div>
    </div>
  );
}