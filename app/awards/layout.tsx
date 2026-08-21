import type { Metadata } from "next"
export const metadata: Metadata = { title: "Awards", description: "Awards and recognition earned by IEEE SIGHT ISIMM teams and projects.", alternates: { canonical: "/awards" } }
export default function AwardsLayout({ children }: { children: React.ReactNode }) { return children }
