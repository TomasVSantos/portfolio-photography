import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tomás Santos — Photography",
  description: "Documentary, travel, and street photography by Tomás Santos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
