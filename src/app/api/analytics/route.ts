import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const includeAudit = searchParams.get('audit') === 'true';

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // CRITICAL: Only count COMPLETED orders with payment verification
    const baseOrderFilter = {
      status: 'COMPLETED' as const,
      stripeSessionId: { not: null },
    };

    const totalOrders = await db.order.count({
      where: baseOrderFilter,
    });

    const totalRevenue = await db.order.aggregate({
      where: baseOrderFilter,
      _sum: { totalAmount: true },
    });

    const totalCustomers = await db.user.count({
      where: { role: 'CUSTOMER' },
    });

    const currentMonthRevenue = await db.order.aggregate({
      where: {
        ...baseOrderFilter,
        createdAt: { gte: currentMonth },
      },
      _sum: { totalAmount: true },
    });

    const lastMonthRevenue = await db.order.aggregate({
      where: {
        ...baseOrderFilter,
        createdAt: { gte: lastMonth, lt: currentMonth },
      },
      _sum: { totalAmount: true },
    });

    const lastMonthOrders = await db.order.count({
      where: {
        ...baseOrderFilter,
        createdAt: { gte: lastMonth, lt: currentMonth },
      },
    });

    const currentMonthOrders = await db.order.count({
      where: {
        ...baseOrderFilter,
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

    // Top products - only from COMPLETED orders
    const topProducts = await db.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: baseOrderFilter,
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

    // Revenue by month
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return date;
    }).reverse();

    const revenueByMonth = await Promise.all(
      last6Months.map(async (month) => {
        const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
        const revenue = await db.order.aggregate({
          where: {
            ...baseOrderFilter,
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

    // CRITICAL: Data quality checks
    const dataQuality = {
      // Pending orders older than 24 hours (likely abandoned)
      oldPendingOrders: await db.order.count({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Failed orders
      failedOrders: await db.order.count({
        where: { status: 'FAILED' }
      }),
      // Orders without session IDs (data integrity issue)
      ordersWithoutSession: await db.order.count({
        where: {
          status: 'COMPLETED',
          stripeSessionId: null
        }
      }),
    };

    const response: any = {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      totalCustomers,
      monthlyRevenue: currentMonthRevenue._sum.totalAmount || 0,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      ordersGrowth: Math.round(ordersGrowth * 10) / 10,
      customersGrowth: 0,
      topProducts: topProductsWithDetails,
      revenueByMonth,
      dataQuality,
      timestamp: new Date().toISOString(),
      verified: true,
    };

    // Include detailed audit trail if requested
    if (includeAudit) {
      const allCompletedOrders = await db.order.findMany({
        where: baseOrderFilter,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          influencer: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      response.auditTrail = {
        orders: allCompletedOrders.map(order => ({
          id: order.id,
          date: order.createdAt,
          completedAt: order.updatedAt,
          customer: order.user.name,
          amount: order.totalAmount,
          influencer: order.influencer?.code || null,
          paymentMethod: order.stripeSessionId?.startsWith('cs_') ? 'stripe' : 'paypal',
          items: order.items.map(item => ({
            product: item.product.name,
            price: item.price,
          })),
        })),
        summary: {
          totalOrders: allCompletedOrders.length,
          totalRevenue: allCompletedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
          stripeOrders: allCompletedOrders.filter(o => o.stripeSessionId?.startsWith('cs_')).length,
          paypalOrders: allCompletedOrders.filter(o => !o.stripeSessionId?.startsWith('cs_')).length,
        },
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
