'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface StatsProps {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

export function DashboardStats({
  totalRevenue,
  totalOrders,
  totalCustomers,
  monthlyRevenue,
  revenueGrowth,
  ordersGrowth,
}: StatsProps) {
  const stats = [
    {
      title: 'Total Revenue',
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      change: revenueGrowth,
      changeLabel: 'from last month',
    },
    {
      title: 'Monthly Revenue',
      value: formatPrice(monthlyRevenue),
      icon: TrendingUp,
      change: revenueGrowth,
      changeLabel: 'vs last month',
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingCart,
      change: ordersGrowth,
      changeLabel: 'from last month',
    },
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      icon: Users,
      change: 0,
      changeLabel: 'active users',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isPositive = stat.change >= 0;

        return (
          <Card key={stat.title} className="border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-2">{stat.value}</div>
              {stat.change !== 0 && (
                <div className="flex items-center gap-1 text-xs">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                    {isPositive ? '+' : ''}
                    {stat.change.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">{stat.changeLabel}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}