import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * CRITICAL: Database cleanup endpoint to fix data integrity issues
 * This should be run ONCE to clean up any invalid data from the old system
 * 
 * Access: POST /api/admin/cleanup?verify=true (dry run)
 *         POST /api/admin/cleanup?execute=true (actual cleanup)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const verify = searchParams.get('verify') === 'true';
    const execute = searchParams.get('execute') === 'true';

    if (!verify && !execute) {
      return NextResponse.json({
        error: 'Must specify either ?verify=true or ?execute=true',
      }, { status: 400 });
    }

    const issues: any[] = [];
    const fixes: any[] = [];

    // ISSUE 1: PENDING orders older than 24 hours (abandoned checkouts)
    const oldPendingOrders = await db.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        items: {
          include: {
            product: true,
          }
        },
        user: true,
      }
    });

    if (oldPendingOrders.length > 0) {
      issues.push({
        type: 'OLD_PENDING_ORDERS',
        count: oldPendingOrders.length,
        description: 'Orders in PENDING state for more than 24 hours (likely abandoned)',
        orders: oldPendingOrders.map(o => ({
          id: o.id,
          created: o.createdAt,
          customer: o.user.name,
          amount: o.totalAmount / 100,
        })),
      });

      if (execute) {
        // Mark these as FAILED
        await db.order.updateMany({
          where: {
            id: { in: oldPendingOrders.map(o => o.id) }
          },
          data: {
            status: 'FAILED',
          }
        });

        fixes.push({
          type: 'OLD_PENDING_ORDERS',
          action: 'Marked as FAILED',
          count: oldPendingOrders.length,
        });
      }
    }

    // ISSUE 2: COMPLETED orders without session IDs (data integrity)
    const completedWithoutSession = await db.order.findMany({
      where: {
        status: 'COMPLETED',
        stripeSessionId: null,
      },
      include: {
        user: true,
      }
    });

    if (completedWithoutSession.length > 0) {
      issues.push({
        type: 'COMPLETED_WITHOUT_SESSION',
        count: completedWithoutSession.length,
        description: 'COMPLETED orders without payment session ID (CRITICAL - these should not exist)',
        severity: 'CRITICAL',
        orders: completedWithoutSession.map(o => ({
          id: o.id,
          created: o.createdAt,
          customer: o.user.name,
          amount: o.totalAmount / 100,
        })),
      });

      if (execute) {
        // These need manual review - mark as FAILED for now
        await db.order.updateMany({
          where: {
            id: { in: completedWithoutSession.map(o => o.id) }
          },
          data: {
            status: 'FAILED',
          }
        });

        fixes.push({
          type: 'COMPLETED_WITHOUT_SESSION',
          action: 'Marked as FAILED (REQUIRES MANUAL REVIEW)',
          count: completedWithoutSession.length,
          warning: 'These orders were marked complete but have no payment proof!',
        });
      }
    }

    // ISSUE 3: Duplicate session IDs (shouldn't happen but check)
    const sessionIdCounts = await db.order.groupBy({
      by: ['stripeSessionId'],
      where: {
        stripeSessionId: { not: null },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          }
        }
      }
    });

    if (sessionIdCounts.length > 0) {
      issues.push({
        type: 'DUPLICATE_SESSION_IDS',
        count: sessionIdCounts.length,
        description: 'Multiple orders with same payment session ID',
        severity: 'CRITICAL',
        sessions: sessionIdCounts,
      });
    }

    // ISSUE 4: Influencer code mismatches
    const influencerOrders = await db.order.findMany({
      where: {
        influencerCode: { not: null },
      },
      include: {
        influencer: true,
      }
    });

    const orphanedInfluencerCodes = influencerOrders.filter(o => !o.influencer);

    if (orphanedInfluencerCodes.length > 0) {
      issues.push({
        type: 'ORPHANED_INFLUENCER_CODES',
        count: orphanedInfluencerCodes.length,
        description: 'Orders with influencer codes that don\'t match any influencer',
        orders: orphanedInfluencerCodes.map(o => ({
          id: o.id,
          code: o.influencerCode,
        })),
      });

      if (execute) {
        // Clear invalid influencer codes
        await db.order.updateMany({
          where: {
            id: { in: orphanedInfluencerCodes.map(o => o.id) }
          },
          data: {
            influencerCode: null,
          }
        });

        fixes.push({
          type: 'ORPHANED_INFLUENCER_CODES',
          action: 'Cleared invalid influencer codes',
          count: orphanedInfluencerCodes.length,
        });
      }
    }

    // Calculate current accurate stats
    const accurateStats = {
      totalCompletedOrders: await db.order.count({
        where: {
          status: 'COMPLETED',
          stripeSessionId: { not: null },
        }
      }),
      totalRevenue: await db.order.aggregate({
        where: {
          status: 'COMPLETED',
          stripeSessionId: { not: null },
        },
        _sum: {
          totalAmount: true,
        }
      }),
      pendingOrders: await db.order.count({
        where: { status: 'PENDING' }
      }),
      failedOrders: await db.order.count({
        where: { status: 'FAILED' }
      }),
    };

    return NextResponse.json({
      mode: execute ? 'EXECUTE' : 'VERIFY',
      timestamp: new Date().toISOString(),
      issues: {
        found: issues.length,
        list: issues,
      },
      fixes: execute ? {
        applied: fixes.length,
        list: fixes,
      } : null,
      accurateStats: {
        completedOrders: accurateStats.totalCompletedOrders,
        totalRevenue: (accurateStats.totalRevenue._sum.totalAmount || 0) / 100,
        totalRevenueCents: accurateStats.totalRevenue._sum.totalAmount || 0,
        pendingOrders: accurateStats.pendingOrders,
        failedOrders: accurateStats.failedOrders,
      },
      recommendations: execute ? [
        'Review the fixes applied above',
        'Check your payment processor dashboards to verify actual payments',
        'Run this cleanup again with ?verify=true to ensure all issues are resolved',
      ] : [
        'Review the issues found above',
        'Run with ?execute=true to apply automatic fixes',
        'Manually review CRITICAL issues before executing',
      ],
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';