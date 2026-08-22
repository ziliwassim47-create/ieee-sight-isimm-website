import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ForgotPasswordForm } from "@/components/member/forgot-password-form"

export const metadata: Metadata = { title: "Forgot Password", robots: { index: false, follow: false } }

export default function ForgotPasswordPage() {
  return (
    <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-muted/30 px-4 py-16">
      <Card className="w-full max-w-md"><CardHeader><CardTitle>Forgot Password</CardTitle><CardDescription>Submit your member email. HR/Admin will receive a secure recovery request.</CardDescription></CardHeader><CardContent><ForgotPasswordForm /></CardContent></Card>
    </section>
  )
}
