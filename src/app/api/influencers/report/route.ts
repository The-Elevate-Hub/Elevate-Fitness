import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';

export async function GET() {
  try {
    await requireAdmin();

    const influencers = await db.influencer.findMany({
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
        },
      },
    });

    const report = influencers.map((influencer) => {
      const totalRevenue = influencer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const commission = Math.floor((totalRevenue * influencer.commission) / 100);

      return {
        name: influencer.name,
        code: influencer.code,
        email: influencer.email,
        orders: influencer.orders.length,
        totalRevenue: totalRevenue / 100, // Convert cents to dollars
        commissionRate: influencer.commission,
        commissionEarned: commission / 100, // Convert cents to dollars
        active: influencer.active,
        orderDetails: influencer.orders.map((order) => ({
          date: order.createdAt.toISOString().split('T')[0],
          customerName: order.user.name,
          customerEmail: order.user.email,
          amount: order.totalAmount / 100,
          products: order.items.map((item) => item.product.name).join(', '),
        })),
      };
    });

    // Calculate totals
    const totalRevenue = report.reduce((sum, inf) => sum + inf.totalRevenue, 0);
    const totalCommission = report.reduce((sum, inf) => sum + inf.commissionEarned, 0);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalInfluencers: report.length,
        totalRevenue,
        totalCommission,
      },
      influencers: report,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}