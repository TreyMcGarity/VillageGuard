import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VillageGuard",
  description: "A small village guard adventure rebuilt for the web."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}