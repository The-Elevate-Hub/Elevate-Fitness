'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    longDesc: '',
    price: '',
    category: 'COURSE',
    featured: false,
    active: true,
    imageUrl: '',
    fileUrl: '',
    fileSize: '',
  });

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          name: data.name,
          description: data.description,
          longDesc: data.longDesc || '',
          price: (data.price / 100).toFixed(2),
          category: data.category,
          featured: data.featured,
          active: data.active,
          imageUrl: data.imageUrl || '',
          fileUrl: data.fileUrl || '',
          fileSize: data.fileSize || '',
        });
        setIsLoadingData(false);
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load product',
          variant: 'destructive',
        });
        router.push('/admin/products');
      });
  }, [params.id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const priceInCents = Math.round(parseFloat(formData.price) * 100);

      if (isNaN(priceInCents) || priceInCents <= 0) {
        throw new Error('Please enter a valid price');
      }

      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: priceInCents,
          longDesc: formData.longDesc || undefined,
          imageUrl: formData.imageUrl || undefined,
          fileUrl: formData.fileUrl || undefined,
          fileSize: formData.fileSize || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      toast({
        title: 'Success!',
        description: 'Product updated successfully',
      });

      router.push('/admin/products');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete product');
      }

      toast({
        title: 'Success!',
        description: 'Product deleted successfully',
      });

      router.push('/admin/products');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="py-12 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">Edit Product</h1>
            <p className="text-muted-foreground mt-1">Update product details</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longDesc">Long Description</Label>
              <textarea
                id="longDesc"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.longDesc}
                onChange={(e) => setFormData({ ...formData, longDesc: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={isLoading}
                >
                  <option value="COURSE">Course</option>
                  <option value="EBOOK">eBook</option>
                  <option value="BUNDLE">Bundle</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">Download File URL</Label>
              <Input
                id="fileUrl"
                type="url"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileSize">File Size</Label>
              <Input
                id="fileSize"
                value={formData.fileSize}
                onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-input bg-background"
                  disabled={isLoading}
                />
                <span className="text-sm">Featured Product</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-input bg-background"
                  disabled={isLoading}
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="luxury"
                size="lg"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </Button>
              <Link href="/admin/products" className="flex-1">
                <Button type="button" variant="outline" size="lg" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}