import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://d3h420.github.io/NerdBook/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "NerdBook // External Memory Buffer",
  description:
    "Zapomniane komendy, podejrzane workflowy i rzeczy, które kiedyś zadziałały. Prawdopodobnie ważne.",
  applicationName: "NerdBook",
  authors: [{ name: "NerdBook" }],
  keywords: [
    "NerdBook",
    "IT notes",
    "networking lab",
    "runbooks",
    "cheat sheets",
  ],
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "NerdBook",
    title: "NerdBook // External Memory Buffer",
    description: "Forgotten commands, questionable workflows and things that worked once. Probably important.",
    images: [
      {
        url: "og-buffer.png",
        width: 1200,
        height: 630,
        alt: "NerdBook — External Memory Buffer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NerdBook // External Memory Buffer",
    description: "Forgotten commands, questionable workflows and things that worked once. Probably important.",
    images: ["og-buffer.png"],
  },
  icons: {
    icon: "favicon.png",
    shortcut: "favicon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#070a08",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
