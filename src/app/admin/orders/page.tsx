import { db } from '@/lib/db';
import { formatPrice, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export const revalidate = 0;

async function getAllOrders() {
  return db.order.findMany({
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
      influencer: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  const statusColors = {
    COMPLETED: 'bg-green-500/10 text-green-500',
    PENDING: 'bg-yellow-500/10 text-yellow-500',
    FAILED: 'bg-red-500/10 text-red-500',
    REFUNDED: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">All customer orders</p>
      </div>

      {orders.length > 0 ? (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-white/10">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">{order.user.name}</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          statusColors[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.user.email || order.user.phone}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">
                      {formatPrice(order.totalAmount)}
                    </p>
                    {order.influencer && (
                      <p className="text-xs text-muted-foreground mt-1">
                        via {order.influencer.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm font-medium mb-2">Items:</p>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm text-muted-foreground"
                      >
                        <span>{item.product.name}</span>
                        <span>{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/10">
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}