import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin');
  }

  return (
    <>
      <Navbar
        isAuthenticated={true}
        isAdmin={false}
        userName={session.email || 'Customer'}
      />
      <main className="pt-20">{children}</main>
      <Footer />
    </>
  );
}