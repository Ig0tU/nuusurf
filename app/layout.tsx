import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { PostHogProvider } from "./components/PosthogProvider";
import { ThemeProvider } from "./components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ppNeue = localFont({
  src: "../fonts/PPNeueMontreal-Medium.otf",
  variable: "--font-pp-neue",
  display: "swap",
});

const ppSupply = localFont({
  src: "../fonts/PPSupplySans-Regular.otf",
  variable: "--font-pp-supply",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Open Operator - Next-Gen AI Web Agent",
    template: "%s | Open Operator",
  },
  description: "Experience the future of web browsing with our revolutionary AI agent. Watch as artificial intelligence navigates the web with unprecedented precision and intelligence.",
  keywords: [
    "AI web agent",
    "artificial intelligence",
    "web automation",
    "browser automation",
    "Stagehand",
    "Browserbase",
    "web scraping",
    "AI assistant",
    "intelligent browsing",
    "next-generation AI"
  ],
  authors: [{ name: "Browserbase Team" }],
  creator: "Browserbase",
  publisher: "Browserbase",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://operator.browserbase.com",
    title: "Open Operator - Next-Gen AI Web Agent",
    description: "Experience the future of web browsing with our revolutionary AI agent. Watch as artificial intelligence navigates the web with unprecedented precision and intelligence.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Open Operator - AI Web Agent",
      },
    ],
    siteName: "Open Operator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Operator - Next-Gen AI Web Agent",
    description: "Experience the future of web browsing with our revolutionary AI agent.",
    images: ["/og.png"],
    creator: "@browserbase",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/favicon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${ppNeue.variable} ${ppSupply.variable} font-sans antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
