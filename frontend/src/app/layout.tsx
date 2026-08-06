import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Jumarald Pharmacy & Wellness | Trusted Online Pharmacy & Telehealth",
  description:
    "Order certified prescription medications, OTC remedies, immunity supplements, and book online doctor consultations with delivery across Greater Accra, Ghana.",
  keywords: ["Pharmacy", "Prescription medicines", "Telehealth", "Ghana", "Jumarald Pharmacy", "Doctor consultation"],
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
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
