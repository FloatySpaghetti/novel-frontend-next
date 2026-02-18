// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/store/Providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToasterProvider from "@/store/ToasterProvider";
import SocialBarLoader from '@/components/ads/SocialBarLoader'; // ✅ Add this

...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://api.noveltavern.com" />
        <link rel="preconnect" href="https://api.noveltavern.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          {children}
          <Footer />
          <ToasterProvider />
        </Providers>

        {/* ✅ Load SocialBar only on chapter pages */}
        <SocialBarLoader />
      </body>
    </html>
  );
}
