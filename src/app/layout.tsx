import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import { CustomCursor } from '@/components/CustomCursor';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Elevate Fitness - Transform Your Body & Mind',
  description: 'Premium fitness courses, expert workout plans, and comprehensive wellness guides designed for excellence.',
  keywords: ['fitness', 'workout', 'health', 'wellness', 'courses', 'training'],
  authors: [{ name: 'Hemansh Kumar Mishra' }],
  openGraph: {
    title: 'Elevate Fitness',
    description: 'Transform your fitness journey with premium courses and expert guidance.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elevate Fitness',
    description: 'Transform your fitness journey with premium courses and expert guidance.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      {/* Custom Cursor */}
      <CustomCursor />
      {/* Vercel Analytics */}
      <Analytics />
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}