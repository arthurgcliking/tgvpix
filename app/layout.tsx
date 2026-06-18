import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TGVPIX — European Railway Photography",
  description: "High-speed railway photography across Europe.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#02040b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
