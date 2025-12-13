import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import Link from 'next/link';
import { ArrowRight, Award, Clock, Download } from 'lucide-react';
import { Suspense } from 'react';

export const revalidate = 3600;

async function getFeaturedProducts() {
  return db.product.findMany({
    where: {
      featured: true,
      active: true,
    },
    take: 3,
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="min-h-screen bg-background">
      <Hero />

      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-foreground">
            Why Choose Elevate?
          </h2>
          <div className="h-1 w-24 mx-auto bg-accent mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="glass-effect p-8 rounded-2xl hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-4 text-foreground">
                Expert-Crafted Content
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Every course and guide is meticulously designed by certified fitness professionals with years of experience.
              </p>
            </div>

            <div className="glass-effect p-8 rounded-2xl hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-4 text-foreground">
                Lifetime Access
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Purchase once and access your content forever. No subscriptions, no recurring fees.
              </p>
            </div>

            <div className="glass-effect p-8 rounded-2xl hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                <Download className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-4 text-foreground">
                Instant Downloads
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Get immediate access to all your purchases. Download and start your journey right away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Temporarily disabled 3D models - uncomment after fixing Three.js SSR */}
      {/* <Suspense fallback={<div className="h-[300vh] bg-background" />}>
        <Rotating3DModels />
      </Suspense> */}

      <section className="py-24 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-foreground">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our most popular fitness courses and wellness guides, handpicked to accelerate your transformation.
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="text-center">
                <Link href="/products">
                  <Button variant="luxury" size="xl" className="group">
                    View All Products
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6">
                No products available yet. Check back soon!
              </p>
              <Link href="/products">
                <Button variant="outline">Browse All Products</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-foreground">
            Ready to Transform?
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Join thousands of people who have already elevated their fitness journey with our premium programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button variant="luxury" size="xl">
                Get Started Today
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="xl">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}