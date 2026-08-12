import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jumarald Mailer Microservice",
  description: "High-reliability transactional email relay microservice for Jumarald Pharmacy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
