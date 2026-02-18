// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/store/Providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToasterProvider from "@/store/ToasterProvider";
import SocialBarLoader from '@/components/ads/SocialBarLoader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title:
    "Read Listen free novel Online. Stream Audiobooks and audionovel full NovelTavern",
  description:
    "Discover thousands of novels and novel updates to read and listen online for free. Enjoy popular genres including romance, fantasy, cultivation, translated novels & more. Stream audiobooks and eBooks anytime, anywhere for completely free. Start your free literary adventure now!",
  icons: {
    icon: "/book-icon.svg",
  },
  other: {
    "theme-color": "#2563EB",
  },
};

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
        <SocialBarLoader />
      </body>
    </html>
  );
}
