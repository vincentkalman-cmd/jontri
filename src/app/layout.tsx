import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Jontri | AI-Powered Business Consulting",
  description:
    "Jontri helps businesses increase income and decrease expenses through intelligent AI automation solutions.",
  keywords: [
    "AI consulting",
    "business automation",
    "AI automation",
    "reduce expenses",
    "increase revenue",
  ],
  openGraph: {
    title: "Jontri | AI-Powered Business Consulting",
    description:
      "Increase income. Decrease expenses. AI automation that delivers real results.",
    url: "https://jontri.com",
    siteName: "Jontri",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jontri | AI-Powered Business Consulting",
    description:
      "Increase income. Decrease expenses. AI automation that delivers real results.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Script
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="69ddbc34d0d6ea7f611e9094"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
