import type { Metadata } from "next"
import { CircleUserRound } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MemberLoginForm } from "@/components/member/member-login-form"

export const metadata: Metadata = {
  title: "Member Login",
  description: "Access the IEEE SIGHT ISIMM member portal.",
  robots: { index: false, follow: false },
}

export default function MemberLoginPage() {
  return (
    <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gradient-to-b from-red-50 to-background px-4 py-16 dark:from-red-950/20">
      <Card className="w-full max-w-lg border-red-100 shadow-xl dark:border-red-900/50">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CircleUserRound className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Member Login</CardTitle>
          <CardDescription>
            Sign in to view your SIGHT activity, projects, volunteer hours, and certificates.
          </CardDescription>
        </CardHeader>
        <CardContent><MemberLoginForm /></CardContent>
      </Card>
    </section>
  )
}
