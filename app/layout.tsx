import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { NotificationProvider } from "@/contexts/notification-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nextjs-firebase-starter.vercel.app"),
  title: {
    default: "Next.js 16 + Firebase Boilerplate",
    template: "%s | Next.js Firebase Boilerplate",
  },
  description:
    "Production-ready Next.js 16 + Firebase boilerplate with built-in authentication, server-side rendering, and TypeScript support for rapid application development",
  authors: [{ name: "zeikar", url: "https://github.com/zeikar" }],
  creator: "zeikar",
  openGraph: {
    siteName: "Next.js Firebase Boilerplate",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://dogimg.vercel.app/api/og?url=https://nextjs-firebase-starter.vercel.app/",
        width: 1200,
        height: 630,
        alt: "Next.js 16 + Firebase Boilerplate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "https://dogimg.vercel.app/api/og?url=https://nextjs-firebase-starter.vercel.app/",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NotificationProvider>{children}</NotificationProvider>
        <Analytics />
      </body>
    </html>
  );
}
