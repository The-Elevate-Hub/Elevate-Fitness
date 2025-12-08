import { db } from '@/lib/db';
import { formatPrice, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

async function getAllProducts() {
  return db.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { orderItems: true },
      },
    },
  });
}

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button variant="luxury" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Product
          </Button>
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-6">
          {products.map((product) => (
            <Card key={product.id} className="border-white/10">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-accent tracking-widest uppercase">
                            {product.category}
                          </span>
                          {product.featured && (
                            <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                              FEATURED
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              product.active
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            {product.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-accent">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{product.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div>
                        <span className="font-medium">Sales:</span> {product._count.orderItems}
                      </div>
                      {product.fileSize && (
                        <div>
                          <span className="font-medium">Size:</span> {product.fileSize}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {formatDate(product.createdAt)}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/products/${product.slug}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/10">
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground mb-6">No products yet</p>
            <Link href="/admin/products/new">
              <Button variant="luxury">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}