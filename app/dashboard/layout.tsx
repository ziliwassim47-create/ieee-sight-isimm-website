import type { Metadata } from "next"
import type { ReactNode } from "react"
import { MemberShell } from "@/components/member/member-shell"

export const metadata: Metadata = { title: { default: "SIGHT ISIMM - humanitarian technology", template: "SIGHT ISIMM - humanitarian technology" }, robots: { index: false, follow: false } }

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <MemberShell>{children}</MemberShell>
}
