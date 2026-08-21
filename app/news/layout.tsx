import type { Metadata } from "next"
export const metadata: Metadata = { title: "News", description: "Announcements, opportunities and impact stories from IEEE SIGHT ISIMM.", alternates: { canonical: "/news" } }
export default function NewsLayout({ children }: { children: React.ReactNode }) { return children }
