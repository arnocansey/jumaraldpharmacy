import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AdminShell } from "@/components/layout/AdminShell";
import { Providers } from "./providers";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Jumarald Pharmacy Control Panel & Operations",
  description:
    "Enterprise administration portal for sales analytics, prescription review, order fulfillment, and inventory tracking.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jumarald Admin",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => console.log('Admin SW registered:', reg.scope))
                    .catch((err) => console.error('Admin SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
        <Providers>
          <AdminShell>{children}</AdminShell>
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
