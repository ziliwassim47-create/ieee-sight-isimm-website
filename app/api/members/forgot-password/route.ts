import { createHash, randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { email = "" } = await request.json()
    const normalizedEmail = String(email).trim().toLowerCase()
    const db = await getDb()
    const member = await db.collection("members").findOne({ email: normalizedEmail })

    if (member) {
      const token = randomBytes(32).toString("hex")
      await db.collection("password_reset_requests").insertOne({
        memberId: member._id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      })
      await db.collection("password_reset_requests").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      await db.collection("admin_notifications").insertOne({
        type: "password_reset_requested",
        memberId: member._id,
        email: normalizedEmail,
        read: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      message: "If this member account exists, a password reset request has been sent to the administrators.",
    })
  } catch {
    return NextResponse.json({ success: false, message: "Password recovery is unavailable. Check the database configuration." }, { status: 503 })
  }
}
