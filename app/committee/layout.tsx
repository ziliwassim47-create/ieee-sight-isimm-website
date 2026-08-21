import type { Metadata } from "next"
export const metadata: Metadata = { title: "Leadership Team", description: "IEEE SIGHT ISIMM committee and leadership mandates.", alternates: { canonical: "/team" } }
export default function CommitteeLayout({ children }: { children: React.ReactNode }) { return children }
