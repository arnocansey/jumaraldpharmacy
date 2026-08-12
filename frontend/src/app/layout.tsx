import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
const geist = { className: "font-sans", variable: "--font-sans" };

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#059669",
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Jumarald Pharmacy & Wellness | Trusted Online Pharmacy & Telehealth",
  description:
    "Order certified prescription medications, OTC remedies, immunity supplements, and book online doctor consultations with delivery across Greater Accra, Ghana.",
  keywords: ["Pharmacy", "Prescription medicines", "Telehealth", "Ghana", "Jumarald Pharmacy", "Doctor consultation"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jumarald",
  },
  openGraph: {
    title: "Jumarald Pharmacy & Wellness Platform",
    description: "Enterprise healthcare & pharmaceutical ordering platform.",
    url: "https://jumaraldpharmacy.com",
    siteName: "Jumarald Pharmacy",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: "Jumarald Pharmacy & Wellness",
    url: "https://jumaraldpharmacy.com",
    logo: "https://jumaraldpharmacy.com/logo.png",
    telephone: "+233 054-477-2483",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Prampram",
      addressLocality: "Greater Accra",
      addressCountry: "GH",
    },
    openingHours: "Mo-Su 09:00-17:00",
  };

  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then((reg) => {
                  console.log('SW registered:', reg.scope);
                  reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                      });
                    }
                  });
                })
                .catch((err) => console.error('SW registration failed:', err));
            });
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data.type === 'ORDER_QUEUED') {
                window.dispatchEvent(new CustomEvent('sw:order-queued', { detail: event.data.data }));
              }
              if (event.data.type === 'ORDERS_SYNCED') {
                window.dispatchEvent(new CustomEvent('sw:orders-synced', { detail: event.data.count }));
              }
            });
          }
        ` }} />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300">
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
