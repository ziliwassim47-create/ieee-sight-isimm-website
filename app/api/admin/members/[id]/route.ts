import { NextRequest, NextResponse } from "next/server"
import { GridFSBucket, ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { authorizePlatform } from "@/lib/platform-permissions"
import { MEMBER_ROLES, MEMBER_STATUSES, serializeMember } from "@/lib/member-types"
import { hashPassword } from "@/lib/password"
import { storeMemberCredential } from "@/lib/credential-vault"

type Context = { params: Promise<{ id: string }> }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const requiredTextFields = ["firstName", "lastName", "email", "ieeeMemberId", "university", "department", "studyLevel"] as const
const optionalTextFields = ["middleName", "ieeeGrade", "ieeeStatus", "officerPosition", "photoUrl", "linkedin", "github", "portfolio"] as const
const listFields = ["skills", "interests", "technologies", "sdgs"] as const

export async function PUT(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "members.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid member ID" }, { status: 400 })

  try {
    const body = await request.json()
    const update: Record<string, unknown> = { updatedAt: new Date() }
    if (body.status !== undefined) {
      if (!MEMBER_STATUSES.includes(body.status)) return NextResponse.json({ success: false, message: "Invalid member status" }, { status: 400 })
      update.status = body.status
      update.approvedAt = body.status === "active" ? new Date() : null
    }
    if (body.role !== undefined) {
      if (!MEMBER_ROLES.includes(body.role)) return NextResponse.json({ success: false, message: "Invalid member role" }, { status: 400 })
      update.role = body.role
    }
    for (const field of requiredTextFields) {
      if (body[field] === undefined) continue
      const value = String(body[field]).trim()
      if (!value) return NextResponse.json({ success: false, message: `${field} is required` }, { status: 400 })
      update[field] = field === "email" ? value.toLowerCase() : value
    }
    if (typeof update.email === "string" && !emailPattern.test(update.email)) {
      return NextResponse.json({ success: false, message: "Enter a valid member email address" }, { status: 400 })
    }
    for (const field of optionalTextFields) {
      if (body[field] !== undefined) update[field] = String(body[field]).trim()
    }
    for (const field of listFields) {
      if (body[field] === undefined) continue
      if (!Array.isArray(body[field])) return NextResponse.json({ success: false, message: `${field} must be a list` }, { status: 400 })
      update[field] = body[field].map((value: unknown) => String(value).trim()).filter(Boolean)
    }
    let newPassword = ""
    if (body.password !== undefined && String(body.password).length > 0) {
      const password = String(body.password)
      if (password.length < 8) return NextResponse.json({ success: false, message: "The new password must contain at least 8 characters" }, { status: 400 })
      update.passwordHash = await hashPassword(password)
      update.passwordChangedAt = new Date()
      newPassword = password
    }

    const db = await getDb()
    const member = await db.collection("members").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after", projection: { passwordHash: 0 } }
    )
    if (!member) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })
    if (newPassword) await storeMemberCredential(db, new ObjectId(id), newPassword, auth.member?._id ? new ObjectId(auth.member._id) : "bootstrap-admin")
    return NextResponse.json({ success: true, data: serializeMember(member) })
  } catch (error: unknown) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000
    return NextResponse.json(
      { success: false, message: duplicate ? "A member with this email or IEEE Member ID already exists" : "Failed to update member" },
      { status: duplicate ? 409 : 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "members.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid member ID" }, { status: 400 })

  try {
    const db = await getDb()
    const memberId = new ObjectId(id)
    const certificateFiles = await db.collection("certificates").find({ memberId, fileId: { $exists: true } }, { projection: { fileId: 1 } }).toArray()
    const result = await db.collection("members").deleteOne({ _id: memberId })
    if (!result.deletedCount) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })
    await Promise.all([
      db.collection("event_registrations").deleteMany({ memberId }),
      db.collection("attendance").deleteMany({ memberId }),
      db.collection("project_members").deleteMany({ memberId }),
      db.collection("volunteer_hours").deleteMany({ memberId }),
      db.collection("certificates").deleteMany({ memberId }),
      db.collection("member_badges").deleteMany({ memberId }),
      db.collection("member_achievements").deleteMany({ memberId }),
      db.collection("score_entries").deleteMany({ memberId }),
      db.collection("member_notifications").deleteMany({ memberId }),
      db.collection("activity_logs").deleteMany({ memberId }),
      db.collection("password_reset_requests").deleteMany({ memberId }),
      db.collection("member_credentials").deleteMany({ memberId }),
      db.collection("credential_audit_logs").deleteMany({ memberId }),
    ])
    if (certificateFiles.length) {
      const bucket = new GridFSBucket(db, { bucketName: "certificate-files" })
      await Promise.all(certificateFiles.filter((item) => ObjectId.isValid(String(item.fileId))).map((item) => bucket.delete(new ObjectId(String(item.fileId))).catch(() => undefined)))
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to delete member" }, { status: 500 })
  }
}
