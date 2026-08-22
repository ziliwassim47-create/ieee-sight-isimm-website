import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { AdminToaster } from "@/components/AdminToaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ScrollToTop } from "@/components/scroll-to-top"
import { SatoutAI } from "@/components/satout-ai"

const websiteTitle = "SIGHT ISIMM - humanitarian technology"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sight-isimm.ieee.tn"),
  title: {
    default: websiteTitle,
    template: websiteTitle,
  },
  applicationName: "SIGHT ISIMM",
  description: "IEEE SIGHT ISIMM turns engineering, innovation and community engagement into sustainable humanitarian impact.",
  keywords: ["IEEE", "SIGHT", "ISIMM", "humanitarian technology", "Tunisia", "technology for good"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SIGHT ISIMM",
    title: websiteTitle,
    description: "Discover the projects, events and community impact of IEEE SIGHT ISIMM.",
    images: [{ url: "/images/home/hero-image.png", width: 1200, height: 630, alt: "IEEE SIGHT ISIMM community" }],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [{ url: "/favicon-sight.ico", type: "image/x-icon" }],
    shortcut: "/favicon-sight.ico",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="sight-theme" disableTransitionOnChange>
          <a href="#main-content" className="skip-link">Skip to content</a>
          <Header />
          <main id="main-content" className="pt-20">{children}</main>
          <Footer />
          <AdminToaster />
          <ScrollToTop />
          <SatoutAI />
        </ThemeProvider>
      </body>
    </html>
  )
}
