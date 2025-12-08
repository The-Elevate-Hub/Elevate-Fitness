import { db } from '@/lib/db';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Category } from '@prisma/client';

export const revalidate = 3600;

interface ProductsPageProps {
  searchParams: { category?: string };
}

async function getProducts(category?: string) {
  const where: any = { active: true };

  if (category) {
    where.category = category.toUpperCase() as Category;
  }

  return db.product.findMany({
    where,
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const products = await getProducts(searchParams.category);

  const categories = [
    { label: 'All Products', value: '' },
    { label: 'Courses', value: 'course' },
    { label: 'eBooks', value: 'ebook' },
    { label: 'Bundles', value: 'bundle' },
  ];

  const activeCategory = searchParams.category || '';

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-foreground">
            Our Products
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Premium fitness courses, comprehensive eBooks, and complete wellness bundles designed to transform your journey.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <a
              key={category.value}
              href={category.value ? `/products?category=${category.value}` : '/products'}
            >
              <Button
                variant={activeCategory === category.value ? 'luxury' : 'outline'}
                size="sm"
              >
                {category.label}
              </Button>
            </a>
          ))}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
            <h2 className="text-2xl font-serif font-semibold mb-2 text-foreground">
              No products found
            </h2>
            <p className="text-muted-foreground mb-6">
              Check back soon for new products!
            </p>
            <a href="/products">
              <Button variant="luxury">View All Products</Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}