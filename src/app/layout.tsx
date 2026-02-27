import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AR Gallery | Vision 2026",
  description: "Modern Augmented Reality Gallery App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen pt-20 px-4 md:px-8 max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
