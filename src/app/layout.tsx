import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bidaaya - MENA Student-Company Platform",
  description: "Connect MENA region students with top companies, startups, and influencers for internship opportunities",
  keywords: ["MENA", "internships", "students", "companies", "career", "platform", "Middle East", "North Africa"],
  authors: [{ name: "Bidaaya Team" }],
  creator: "Bidaaya",
  publisher: "Bidaaya",
  // Favicon and icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bidaaya.ae'),

  // Open Graph / Facebook
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bidaaya.vercel.app',
    siteName: 'Bidaaya',
    title: 'Bidaaya - MENA Student-Company Platform',
    description: 'Connect MENA region students with top companies, startups, and influencers for internship opportunities',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Bidaaya - MENA Student-Company Platform',
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Bidaaya - MENA Student-Company Platform',
    description: 'Connect MENA region students with top companies, startups, and influencers for internship opportunities',
    images: ['/og-image.png'],
    creator: '@bidaaya',
  },
  
  // Additional metadata
  robots: 'index, follow',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a081a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0a081a" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
