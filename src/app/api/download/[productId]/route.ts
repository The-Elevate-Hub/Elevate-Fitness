import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await requireAuth();

    const product = await db.product.findUnique({
      where: { id: params.productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const order = await db.order.findFirst({
      where: {
        userId: session.userId,
        status: 'COMPLETED',
        items: {
          some: {
            productId: params.productId,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'You do not own this product' },
        { status: 403 }
      );
    }

    const headers = request.headers;
    const ipAddress = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';

    await db.downloadLog.create({
      data: {
        userId: session.userId,
        productId: params.productId,
        ipAddress,
        userAgent,
      },
    });

    if (!product.fileUrl) {
      return NextResponse.json(
        { error: 'Download not available. Please contact support.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      downloadUrl: product.fileUrl,
      fileName: product.name,
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download link' },
      { status: 500 }
    );
  }
}