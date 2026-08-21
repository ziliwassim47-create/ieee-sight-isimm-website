import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { unauthorizedUnlessAdmin } from "@/lib/admin-auth"
import { hashPassword } from "@/lib/password"

type Context = { params: Promise<{ id: string }> }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function PUT(request: NextRequest, context: Context) {
  const unauthorized = unauthorizedUnlessAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid account ID" }, { status: 400 })

  try {
    const body = await request.json()
    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 })
      update.name = name
    }
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase()
      if (!emailPattern.test(email)) return NextResponse.json({ success: false, message: "A valid email is required" }, { status: 400 })
      update.email = email
    }
    if (body.password) {
      const password = String(body.password)
      if (password.length < 8) return NextResponse.json({ success: false, message: "Password must contain at least 8 characters" }, { status: 400 })
      update.passwordHash = await hashPassword(password)
    }
    if (body.active !== undefined) update.active = Boolean(body.active)

    const db = await getDb()
    const result = await db.collection("admin_accounts").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after", projection: { passwordHash: 0 } }
    )
    if (!result) return NextResponse.json({ success: false, message: "Account not found" }, { status: 404 })

    return NextResponse.json({ success: true, data: { ...result, _id: result._id.toString() } })
  } catch (error: unknown) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000
    return NextResponse.json(
      { success: false, message: duplicate ? "An account with this email already exists" : "Failed to update admin account" },
      { status: duplicate ? 409 : 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const unauthorized = unauthorizedUnlessAdmin(request)
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid account ID" }, { status: 400 })

  try {
    const db = await getDb()
    const result = await db.collection("admin_accounts").deleteOne({ _id: new ObjectId(id) })
    if (!result.deletedCount) return NextResponse.json({ success: false, message: "Account not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to delete admin account", error: String(error) }, { status: 500 })
  }
}
