import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./home.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  axes: ["opsz"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://jontri.com";
const TITLE = "Jontri | AI Voice Agents, Lead Generation & Automation";
const DESCRIPTION =
  "Jontri sets up and manages AI voice agents, lead prospecting, website chatbots, review management, and SEO for businesses, so you capture every lead and cut busywork.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Jontri",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  applicationName: "Jontri",
  openGraph: {
    title: TITLE,
    description:
      "Done-for-you AI automation: 24/7 AI call answering, automated lead generation, chatbots, and SEO that gets you found on Google and in AI answers.",
    url: SITE_URL,
    siteName: "Jontri",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "Done-for-you AI automation: 24/7 AI call answering, automated lead generation, chatbots, and SEO.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
