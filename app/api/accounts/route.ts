import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { unauthorizedUnlessAdmin } from "@/lib/admin-auth"
import { hashPassword } from "@/lib/password"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(request: NextRequest) {
  const unauthorized = unauthorizedUnlessAdmin(request)
  if (unauthorized) return unauthorized

  try {
    const db = await getDb()
    const accounts = await db
      .collection("admin_accounts")
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: accounts.map((account) => ({ ...account, _id: account._id.toString() })),
      bootstrapAccount: process.env.ADMIN_EMAIL || null,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to load admin accounts", error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = unauthorizedUnlessAdmin(request)
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const name = String(body.name || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")

    if (!name || !emailPattern.test(email) || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Name, a valid email, and a password of at least 8 characters are required" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const collection = db.collection("admin_accounts")
    await collection.createIndex({ email: 1 }, { unique: true })
    const now = new Date()
    const account = {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "admin",
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    const result = await collection.insertOne(account)

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId.toString(), name, email, role: account.role, active: account.active, createdAt: now, updatedAt: now },
    })
  } catch (error: unknown) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000
    return NextResponse.json(
      { success: false, message: duplicate ? "An account with this email already exists" : "Failed to create admin account" },
      { status: duplicate ? 409 : 500 }
    )
  }
}
