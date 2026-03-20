import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aria Luxury | Premium Fleet Management",
  description: "A sleek, modern admin dashboard for managing luxury car fleets with real-time analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#f8fafc] text-[#0f172a]`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
