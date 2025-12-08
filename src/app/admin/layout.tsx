import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingBag, Megaphone } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const sidebarLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/influencers', label: 'Influencers', icon: Megaphone },
  ];

  return (
    <>
      <Navbar isAuthenticated={true} isAdmin={true} userName="Admin" />
      <div className="flex pt-20 min-h-screen bg-background">
        <aside className="hidden lg:block w-64 border-r border-white/10 p-6">
          <nav className="space-y-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}