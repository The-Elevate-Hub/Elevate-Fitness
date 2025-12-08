import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  longDesc: z.string().optional(),
  price: z.number().positive(),
  category: z.enum(['COURSE', 'EBOOK', 'BUNDLE']),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  imageUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSize: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const where: any = { active: true };

    if (category) {
      where.category = category.toUpperCase();
    }

    if (featured === 'true') {
      where.featured = true;
    }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const slug = slugify(validatedData.name);

    const existingProduct = await db.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this name already exists' },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        ...validatedData,
        slug,
        featured: validatedData.featured ?? false,
        active: validatedData.active ?? true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}