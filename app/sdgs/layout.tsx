import type { Metadata } from "next"
export const metadata: Metadata = { title: "Sustainable Development Goals", description: "How IEEE SIGHT ISIMM projects contribute to the UN Sustainable Development Goals.", alternates: { canonical: "/sdgs" } }
export default function SdgsLayout({ children }: { children: React.ReactNode }) { return children }
