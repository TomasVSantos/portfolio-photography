import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { getCanonicalUrl } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: getCanonicalUrl("/") },
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: getCanonicalUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
