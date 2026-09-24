import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jontri.com"),
  title: "Jontri | AI-Powered Business Consulting",
  description:
    "Jontri helps businesses increase income and decrease expenses through intelligent AI automation. Expert consulting and custom automation solutions that deliver measurable results.",
  keywords: [
    "AI consulting",
    "business automation",
    "AI automation",
    "reduce expenses",
    "increase revenue",
  ],
  alternates: {
    canonical: "https://jontri.com",
  },
  openGraph: {
    title: "Jontri | AI-Powered Business Consulting",
    description:
      "Increase income. Decrease expenses. AI automation that delivers real results.",
    url: "https://jontri.com",
    siteName: "Jontri",
    type: "website",
    // TODO (manual): add og:image once a 1200x630 brand image is created and placed in public/
  },
  twitter: {
    card: "summary_large_image",
    title: "Jontri | AI-Powered Business Consulting",
    description:
      "Increase income. Decrease expenses. AI automation that delivers real results.",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Jontri",
      url: "https://jontri.com",
      description:
        "AI-powered business consulting helping companies increase income and decrease expenses through intelligent automation solutions.",
    },
    {
      "@type": "WebSite",
      name: "Jontri",
      url: "https://jontri.com",
    },
    {
      "@type": "ProfessionalService",
      name: "Jontri",
      url: "https://jontri.com",
      description:
        "AI automation consulting services that help businesses increase revenue and reduce operational costs.",
      serviceType: "AI Business Consulting",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
