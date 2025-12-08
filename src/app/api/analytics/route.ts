import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

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

    const currentMonthOrders = await db.order.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: currentMonth },
      },
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
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
    });

    const revenueGrowth = lastMonthRevenue._sum.totalAmount
      ? ((((currentMonthRevenue._sum.totalAmount || 0) - (lastMonthRevenue._sum.totalAmount || 0)) /
          (lastMonthRevenue._sum.totalAmount || 1)) *
          100)
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
            createdAt: {
              gte: month,
              lt: nextMonth,
            },
          },
          _sum: { totalAmount: true },
        });

        return {
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: revenue._sum.totalAmount || 0,
        };
      })
    );

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      totalCustomers,
      monthlyRevenue: currentMonthRevenue._sum.totalAmount || 0,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      ordersGrowth: Math.round(ordersGrowth * 10) / 10,
      customersGrowth: 0,
      topProducts: topProductsWithDetails,
      revenueByMonth,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}