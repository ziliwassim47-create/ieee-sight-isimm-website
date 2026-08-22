import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { verifyPassword } from "@/lib/password"
import { setMemberCookie } from "@/lib/member-auth"

const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  const now = Date.now()
  const attempt = attempts.get(key)
  if (attempt && attempt.resetAt > now && attempt.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ success: false, message: "Too many login attempts. Please try again later." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")
    const db = await getDb()
    const member = await db.collection("members").findOne({ email })
    const valid = Boolean(member?.passwordHash && await verifyPassword(password, String(member.passwordHash)))

    if (!valid) {
      attempts.set(key, attempt && attempt.resetAt > now ? { ...attempt, count: attempt.count + 1 } : { count: 1, resetAt: now + WINDOW_MS })
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }
    if (member?.status === "pending") {
      return NextResponse.json({ success: false, status: "pending", message: "Your account is pending HR/Admin approval." }, { status: 403 })
    }
    if (member?.status !== "active") {
      return NextResponse.json({ success: false, message: "This member account is not active." }, { status: 403 })
    }

    attempts.delete(key)
    const response = NextResponse.json({ success: true, redirectTo: member.role === "admin" ? "/dashboard/excom" : "/dashboard" })
    setMemberCookie(response, member._id.toString(), String(member.role || "member"))
    return response
  } catch {
    return NextResponse.json({ success: false, message: "Member login is unavailable. Check the database configuration." }, { status: 503 })
  }
}
