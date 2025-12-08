import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getSession } from '@/lib/auth';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <>
      <Navbar
        isAuthenticated={!!session}
        isAdmin={session?.role === 'ADMIN'}
        userName={session?.email || session?.phone}
      />
      <main>{children}</main>
      <Footer />
    </>
  );
}