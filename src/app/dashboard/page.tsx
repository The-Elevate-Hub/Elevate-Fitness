import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import { Download, ShoppingBag, Package } from 'lucide-react';
import Link from 'next/link';

async function getUserOrders(userId: string) {
  return db.order.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin');
  }

  const orders = await getUserOrders(session.userId);
  const allProducts = orders.flatMap((order) => order.items.map((item) => item.product));
  const uniqueProducts = Array.from(new Map(allProducts.map((p) => [p.id, p])).values());

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold mb-2">Welcome Back!</h1>
          <p className="text-muted-foreground">
            Manage your purchases and downloads
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{uniqueProducts.length}</div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{orders.length}</div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {formatPrice(orders.reduce((sum, order) => sum + order.totalAmount, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-serif font-bold mb-6">My Products</h2>
            {uniqueProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uniqueProducts.map((product) => (
                  <Card key={product.id} className="border-white/10 hover:border-accent/50 transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      {product.fileUrl ? (
                        <a href={product.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="luxury" className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Download Now
                          </Button>
                        </a>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          <Download className="mr-2 h-4 w-4" />
                          Coming Soon
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-white/10">
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Browse our products and make your first purchase
                  </p>
                  <Link href="/products">
                    <Button variant="luxury">Browse Products</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold mb-6">Order History</h2>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="border-white/10">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                              {order.status}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <p key={item.id} className="text-sm font-medium">
                                {item.product.name}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-accent">
                            {formatPrice(order.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-white/10">
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}