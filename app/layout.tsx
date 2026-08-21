import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { AdminToaster } from "@/components/AdminToaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SIGHT ISIMM - Humanitarian Technology",
  description: "IEEE ISIMM Student Branch - Special Interest Group in Humanitarian Technology (SIGHT)",
  icons: {
    icon: "/favicon-sight.ico"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="pt-20">{children}</main>
        <Footer />
        <AdminToaster />
      </body>
    </html>
  )
}
