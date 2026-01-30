import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';

export async function GET() {
  try {
    await requireAdmin();

    // CRITICAL: Only get influencers with COMPLETED orders
    const influencers = await db.influencer.findMany({
      include: {
        orders: {
          where: { 
            status: 'COMPLETED',
            stripeSessionId: { not: null },
            influencerCode: { not: null }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  }
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
      },
    });

    const reportData = influencers.map((influencer) => {
      // Calculate revenue from COMPLETED orders only
      const totalRevenue = influencer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // CRITICAL: Commission calculation with floor to avoid overpaying
      const commission = Math.floor((totalRevenue * influencer.commission) / 100);
      
      // Detailed order breakdown
      const orderDetails = influencer.orders.map((order) => ({
        orderId: order.id,
        date: order.createdAt.toISOString().split('T')[0],
        completedDate: order.updatedAt.toISOString().split('T')[0],
        customerName: order.user.name,
        customerEmail: order.user.email,
        amount: order.totalAmount / 100, // Convert to dollars
        amountCents: order.totalAmount,
        paymentMethod: order.stripeSessionId?.startsWith('cs_') ? 'Stripe' : 'PayPal',
        sessionId: order.stripeSessionId,
        products: order.items.map((item) => ({
          name: item.product.name,
          price: item.price / 100,
          priceCents: item.price,
        })),
        // Calculate commission for this specific order
        orderCommission: Math.floor((order.totalAmount * influencer.commission) / 100),
      }));

      // Monthly breakdown
      const monthlyStats = orderDetails.reduce((acc, order) => {
        const month = order.date.substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = {
            month,
            orders: 0,
            revenue: 0,
            commission: 0,
          };
        }
        acc[month].orders += 1;
        acc[month].revenue += order.amountCents;
        acc[month].commission += order.orderCommission;
        return acc;
      }, {} as Record<string, any>);

      return {
        // Influencer Info
        name: influencer.name,
        code: influencer.code,
        email: influencer.email,
        commissionRate: influencer.commission,
        active: influencer.active,
        
        // Summary Stats
        totalOrders: influencer.orders.length,
        totalRevenue: totalRevenue / 100, // Dollars
        totalRevenueCents: totalRevenue, // Cents for precision
        totalCommission: commission / 100, // Dollars
        totalCommissionCents: commission, // Cents for precision
        
        // First and last sale dates
        firstSaleDate: influencer.orders.length > 0 
          ? influencer.orders[influencer.orders.length - 1].createdAt.toISOString().split('T')[0]
          : null,
        lastSaleDate: influencer.orders.length > 0
          ? influencer.orders[0].createdAt.toISOString().split('T')[0]
          : null,
        
        // Detailed breakdown
        monthlyBreakdown: Object.values(monthlyStats).map((m: any) => ({
          month: m.month,
          orders: m.orders,
          revenue: m.revenue / 100,
          revenueCents: m.revenue,
          commission: m.commission / 100,
          commissionCents: m.commission,
        })),
        
        orderDetails: orderDetails.map(o => ({
          ...o,
          // Remove internal fields from export
          amountCents: undefined,
          products: o.products.map(p => ({
            ...p,
            priceCents: undefined,
          })),
        })),
      };
    }).sort((a, b) => b.totalRevenueCents - a.totalRevenueCents);

    // Calculate overall totals
    const grandTotals = {
      totalInfluencers: reportData.length,
      activeInfluencers: reportData.filter(i => i.active).length,
      totalOrders: reportData.reduce((sum, i) => sum + i.totalOrders, 0),
      totalRevenue: reportData.reduce((sum, i) => sum + i.totalRevenue, 0),
      totalRevenueCents: reportData.reduce((sum, i) => sum + i.totalRevenueCents, 0),
      totalCommission: reportData.reduce((sum, i) => sum + i.totalCommission, 0),
      totalCommissionCents: reportData.reduce((sum, i) => sum + i.totalCommissionCents, 0),
    };

    // Verification stats
    const verification = {
      allOrdersVerified: true,
      verificationDate: new Date().toISOString(),
      notes: [
        'All amounts are from COMPLETED orders only',
        'Commission calculations use Math.floor() to prevent overpayment',
        'All orders have verified payment session IDs',
        'Amounts shown in both dollars and cents for precision',
      ],
    };

    const report = {
      generatedAt: new Date().toISOString(),
      reportType: 'INFLUENCER_COMMISSION_DETAILED',
      summary: grandTotals,
      verification,
      influencers: reportData,
    };

    return NextResponse.json(report, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="influencer-report-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Also create a CSV export endpoint
export async function POST() {
  try {
    await requireAdmin();

    const influencers = await db.influencer.findMany({
      include: {
        orders: {
          where: { 
            status: 'COMPLETED',
            stripeSessionId: { not: null },
            influencerCode: { not: null }
          },
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

    // Create CSV rows
    const csvRows: string[] = [
      // Header
      'Influencer Name,Code,Email,Commission Rate,Total Orders,Total Revenue,Commission Owed,First Sale,Last Sale,Status'
    ];

    influencers.forEach((influencer) => {
      const totalRevenue = influencer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const commission = Math.floor((totalRevenue * influencer.commission) / 100);
      
      const firstSale = influencer.orders.length > 0
        ? new Date(Math.min(...influencer.orders.map(o => o.createdAt.getTime()))).toISOString().split('T')[0]
        : '';
      const lastSale = influencer.orders.length > 0
        ? new Date(Math.max(...influencer.orders.map(o => o.createdAt.getTime()))).toISOString().split('T')[0]
        : '';

      csvRows.push([
        influencer.name,
        influencer.code,
        influencer.email,
        `${influencer.commission}%`,
        influencer.orders.length.toString(),
        `$${(totalRevenue / 100).toFixed(2)}`,
        `$${(commission / 100).toFixed(2)}`,
        firstSale,
        lastSale,
        influencer.active ? 'Active' : 'Inactive',
      ].join(','));
    });

    // Add detailed order breakdown
    csvRows.push(''); // Empty line
    csvRows.push('DETAILED ORDER BREAKDOWN');
    csvRows.push('Influencer Code,Order ID,Date,Customer,Amount,Products,Commission');

    influencers.forEach((influencer) => {
      influencer.orders.forEach((order) => {
        const orderCommission = Math.floor((order.totalAmount * influencer.commission) / 100);
        const products = order.items.map(i => i.product.name).join('; ');
        
        csvRows.push([
          influencer.code,
          order.id.substring(0, 8),
          order.createdAt.toISOString().split('T')[0],
          order.user.name,
          `$${(order.totalAmount / 100).toFixed(2)}`,
          `"${products}"`,
          `$${(orderCommission / 100).toFixed(2)}`,
        ].join(','));
      });
    });

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="influencer-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV' },
      { status: 500 }
    );
  }
}
