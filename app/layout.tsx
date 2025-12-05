import type { Metadata } from "next";
import "./globals.css"; // Korrigierter Pfad

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
      <body className="antialiased bg-slate-50">
        {children}
      </body>
    </html>
  );
}