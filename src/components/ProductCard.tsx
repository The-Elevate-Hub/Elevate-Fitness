import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '@prisma/client';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden border-white/10 hover:border-accent/50 transition-all duration-300 bg-card/50 backdrop-blur">
      <Link href={`/products/${product.slug}`}>
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            {product.featured && (
              <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                FEATURED
              </div>
            )}
          </div>
        </CardHeader>
      </Link>

      <CardContent className="p-6">
        <div className="mb-2">
          <span className="text-xs text-accent tracking-widest uppercase">
            {product.category}
          </span>
        </div>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-xl font-serif font-semibold mb-2 text-foreground group-hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {product.description}
        </p>
        {product.fileSize && (
          <p className="text-xs text-muted-foreground">
            File size: {product.fileSize}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-accent">{formatPrice(product.price)}</p>
        </div>
        <Link href={`/products/${product.slug}`}>
          <Button variant="luxury" size="sm" className="group/btn">
            View Details
            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}