import type { Metadata } from "next";
import { Cinzel, Playfair_Display, Poppins } from "next/font/google";

import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://golden-bake-cakes.vercel.app"),
  title: {
    default: "Golden Bake & Cakes | Premium Cakes & Bakery Experience in Gurgaon",
    template: "%s | Golden Bake & Cakes",
  },
  description:
    "A super premium luxury bakery website for Golden Bake & Cakes in Gurgaon with designer cakes, fast ordering, custom cake booking, and an admin dashboard.",
  openGraph: {
    title: "Golden Bake & Cakes",
    description:
      "Premium cakes, pastries, snacks, and online ordering in Gurgaon.",
    images: ["/brand-assets/storefront-hero.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${playfair.variable} ${poppins.variable} scroll-smooth`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
