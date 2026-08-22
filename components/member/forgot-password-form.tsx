"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/members/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const result = await response.json()
      setMessage(result.message || "Your request has been recorded.")
    } catch {
      setMessage("Password recovery is currently unavailable. Please contact HR.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {message && <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-6">{message}</div>}
      <div className="space-y-2"><Label htmlFor="recovery-email">Member email</Label><Input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
        Request Password Reset
      </Button>
      <p className="text-center text-sm"><Link href="/login" className="font-medium text-primary hover:underline">Back to Login</Link></p>
    </form>
  )
}
