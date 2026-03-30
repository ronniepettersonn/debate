import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'De onde nasceu o calvinismo | Natan Rufino',
    template: '%s | Natan Rufino'
  },
  description: "Tudo que você precisa saber para entender como a filosofia predestinista penetrou na comunidade cristã.",

  openGraph: {
    title: "De onde nasceu o calvinismo | Natan Rufino",
    description: "Tudo que você precisa saber para entender como a filosofia predestinista penetrou na comunidade cristã.",
    url: "https://debate.natanrufino.com.br", // importante
    siteName: "De onde nasceu o calvinismo | Natan Rufino",
    images: [
      {
        url: "/og-image.jpg", // relativo ao /public
        width: 1200,
        height: 630,
        alt: "De onde nasceu o calvinismo | Natan Rufino",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "De onde nasceu o calvinismo | Natan Rufino",
    description: "Tudo que você precisa saber para entender como a filosofia predestinista penetrou na comunidade cristã.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180" },
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}
      >
        {children}

        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        <Analytics />
      </body>
    </html>
  );
}