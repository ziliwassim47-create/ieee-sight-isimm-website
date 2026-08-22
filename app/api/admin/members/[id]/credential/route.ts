import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { authorizePlatform } from "@/lib/platform-permissions"
import { revealMemberCredential, storeMemberCredential } from "@/lib/credential-vault"
import { hashPassword } from "@/lib/password"

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "members.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid member ID" }, { status: 400 })

  try {
    const db = await getDb()
    const memberId = new ObjectId(id)
    if (!await db.collection("members").findOne({ _id: memberId }, { projection: { _id: 1 } })) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })
    }
    const credential = await revealMemberCredential(db, memberId)
    await db.collection("credential_audit_logs").insertOne({
      memberId,
      action: "password_revealed",
      viewedBy: auth.member?._id ? new ObjectId(auth.member._id) : "bootstrap-admin",
      createdAt: new Date(),
    })
    return NextResponse.json({
      success: true,
      available: Boolean(credential),
      password: credential?.password || null,
      changedAt: credential?.changedAt || null,
      message: credential ? undefined : "The existing hashed password cannot be recovered. Set a new temporary password first.",
    })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to access the protected member credential" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "members.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid member ID" }, { status: 400 })

  try {
    const { password = "" } = await request.json()
    const temporaryPassword = String(password)
    if (temporaryPassword.length < 8) return NextResponse.json({ success: false, message: "The temporary password must contain at least 8 characters" }, { status: 400 })
    const db = await getDb()
    const memberId = new ObjectId(id)
    const actor = auth.member?._id ? new ObjectId(auth.member._id) : "bootstrap-admin"
    const result = await db.collection("members").updateOne(
      { _id: memberId },
      { $set: { passwordHash: await hashPassword(temporaryPassword), passwordChangedAt: new Date(), updatedAt: new Date() } }
    )
    if (!result.matchedCount) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })
    await Promise.all([
      storeMemberCredential(db, memberId, temporaryPassword, actor),
      db.collection("credential_audit_logs").insertOne({ memberId, action: "password_reset", updatedBy: actor, createdAt: new Date() }),
    ])
    return NextResponse.json({ success: true, password: temporaryPassword, message: "Temporary password saved securely" })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to reset the protected member credential" }, { status: 500 })
  }
}
