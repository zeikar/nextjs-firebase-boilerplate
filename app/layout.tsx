import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { NotificationProvider } from "@/contexts/notification-context";
import { AuthProvider } from "@/contexts/auth-context";
import { SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Next.js 16 + Firebase Boilerplate",
    template: "%s | Next.js Firebase Boilerplate",
  },
  description:
    "Next.js 16 + Firebase boilerplate with server-side authentication and per-user Firestore data, both reached through the Admin SDK",
  authors: [{ name: "zeikar", url: "https://github.com/zeikar" }],
  creator: "zeikar",
  openGraph: {
    siteName: "Next.js Firebase Boilerplate",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: SITE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Next.js 16 + Firebase Boilerplate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [SITE_OG_IMAGE],
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
        <NotificationProvider>
          <AuthProvider>{children}</AuthProvider>
        </NotificationProvider>
        <Analytics />
      </body>
    </html>
  );
}
