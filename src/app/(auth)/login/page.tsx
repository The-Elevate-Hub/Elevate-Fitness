'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isAdminMode ? '/api/auth/admin-login' : '/api/auth/login';
      const payload = isAdminMode
        ? { phone: formData.identifier, password: formData.password }
        : { email: formData.identifier, password: formData.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      toast({
        title: 'Success!',
        description: 'You have been logged in successfully.',
      });

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Login failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <Card className="w-full max-w-md border-white/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-accent" />
            </div>
          </div>
          <CardTitle className="text-3xl font-serif">
            {isAdminMode ? 'Admin Access' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isAdminMode
              ? 'Enter your phone number and password to access admin panel'
              : 'Sign in to your Elevate Fitness account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">
                {isAdminMode ? 'Phone Number' : 'Email'}
              </Label>
              <Input
                id="identifier"
                type={isAdminMode ? 'tel' : 'email'}
                placeholder={isAdminMode ? '+99999999999' : 'your@email.com'}
                value={formData.identifier}
                onChange={(e) =>
                  setFormData({ ...formData, identifier: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              variant="luxury"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            {isAdminMode ? (
              <>
                Not an admin?{' '}
                <button
                  onClick={() => {
                    setIsAdminMode(false);
                    setFormData({ identifier: '', password: '' });
                  }}
                  className="text-accent hover:underline"
                >
                  Customer login
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <Link href="/register" className="text-accent hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </div>
          {!isAdminMode && (
            <button
              onClick={() => {
                setIsAdminMode(true);
                setFormData({ identifier: '', password: '' });
              }}
              className="text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              Admin access
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}