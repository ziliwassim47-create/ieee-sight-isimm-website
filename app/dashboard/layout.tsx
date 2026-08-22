import type { Metadata } from "next"
import type { ReactNode } from "react"
import { MemberShell } from "@/components/member/member-shell"

export const metadata: Metadata = { title: { default: "Member Dashboard", template: "%s | SIGHT Member" }, robots: { index: false, follow: false } }

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <MemberShell>{children}</MemberShell>
}
