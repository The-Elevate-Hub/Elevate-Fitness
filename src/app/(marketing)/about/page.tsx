import { Card, CardContent } from '@/components/ui/card';
import { Award, Target, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-foreground">
            About Elevate Fitness
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transforming lives through premium fitness education and expert guidance
          </p>
        </div>

        <div className="prose prose-invert max-w-none mb-16">
          <p className="text-lg leading-relaxed text-muted-foreground">
            Elevate Fitness was founded with a singular mission: to make world-class fitness education accessible to everyone, everywhere. We believe that transformation begins with the right knowledge, proper guidance, and unwavering commitment.
          </p>

          <p className="text-lg leading-relaxed text-muted-foreground mt-6">
            Our team of certified fitness professionals, nutritionists, and wellness experts have crafted each course, eBook, and resource with meticulous attention to detail. Every piece of content is designed not just to inform, but to inspire action and deliver real, measurable results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="border-white/10 text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <Target className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2">Our Mission</h3>
              <p className="text-muted-foreground">
                Empower individuals to achieve their fitness goals through science-backed, premium content
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2">Our Values</h3>
              <p className="text-muted-foreground">
                Excellence, integrity, and results-driven content that transforms lives
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2">Our Community</h3>
              <p className="text-muted-foreground">
                A global network of fitness enthusiasts supporting each other's journey
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-gradient-to-br from-muted/50 to-background">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-3xl font-serif font-bold mb-4 text-center">
              Leadership
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Meet the visionary behind Elevate Fitness
            </p>
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-semibold mb-2 text-accent">
                Hemansh Kumar Mishra
              </h3>
              <p className="text-lg text-muted-foreground mb-4">Chairman & Founder</p>
              <p className="text-muted-foreground leading-relaxed">
                With a passion for fitness and technology, Hemansh founded Elevate Fitness to bridge the gap between premium fitness education and accessibility. His vision is to create a world where everyone has access to the tools and knowledge needed to achieve their health and fitness goals.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}