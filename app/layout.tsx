import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css"; // Korrigierter Pfad
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "SG Ruwertal 1925 e.V.",
  description: "Dienstplan Management App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased bg-slate-50 min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}