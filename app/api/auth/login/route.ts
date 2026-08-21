import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { setAdminCookie } from "@/lib/admin-auth"
import { getDb } from "@/lib/mongodb"
import { verifyPassword } from "@/lib/password"

const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

function equal(left: string, right: string) {
  const a = createHash("sha256").update(left).digest()
  const b = createHash("sha256").update(right).digest()
  return timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  const now = Date.now()
  const current = attempts.get(key)
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ success: false, message: "Too many login attempts. Please try again later." }, { status: 429 })
  }

  try {
    const { email = "", password = "" } = await request.json()
    const adminEmail = process.env.ADMIN_EMAIL || ""
    const adminPassword = process.env.ADMIN_PASSWORD || ""
    if (!process.env.AUTH_SECRET) {
      return NextResponse.json({ success: false, message: "Admin authentication is not configured." }, { status: 503 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const suppliedPassword = String(password)
    const bootstrapMatch = Boolean(
      adminEmail &&
      adminPassword &&
      equal(normalizedEmail, adminEmail.trim().toLowerCase()) &&
      equal(suppliedPassword, adminPassword)
    )

    let databaseMatch = false
    if (!bootstrapMatch) {
      try {
        const db = await getDb()
        const account = await db.collection("admin_accounts").findOne({ email: normalizedEmail, active: { $ne: false } })
        databaseMatch = Boolean(account?.passwordHash && await verifyPassword(suppliedPassword, String(account.passwordHash)))
      } catch {
        databaseMatch = false
      }
    }

    if (!bootstrapMatch && !databaseMatch) {
      const next = current && current.resetAt > now ? { count: current.count + 1, resetAt: current.resetAt } : { count: 1, resetAt: now + WINDOW_MS }
      attempts.set(key, next)
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    attempts.delete(key)
    const response = NextResponse.json({ success: true, message: "Login successful" })
    setAdminCookie(response)
    return response
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 })
  }
}
