import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"
import { authorizePlatform } from "@/lib/platform-permissions"
import { addMemberNotification } from "@/lib/member-notifications"

export async function GET(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  try {
    const db = await getDb()
    const certificates = await db.collection("certificates").find({ memberId: new ObjectId(auth.member._id), status: "issued" }).sort({ issuedAt: -1 }).toArray()
    return NextResponse.json({ success: true, data: certificates.map((item) => ({ ...item, _id: item._id.toString(), downloadUrl: item.fileId ? `/api/certificates/${item._id}/download` : null })) })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load certificates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorizePlatform(request, "certificates.manage")
  if (!auth.authorized) return auth.response
  try {
    const body = await request.json()
    if (!ObjectId.isValid(body.memberId) || !String(body.title || "").trim()) return NextResponse.json({ success: false, message: "Member and certificate title are required" }, { status: 400 })
    const db = await getDb()
    const memberId = new ObjectId(body.memberId)
    const member = await db.collection("members").findOne({ _id: memberId, status: "active" })
    if (!member) return NextResponse.json({ success: false, message: "Active member not found" }, { status: 404 })
    const code = `SIGHT-ISIMM-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`
    const now = new Date()
    const certificate = { code, memberId, title: String(body.title).trim(), type: String(body.type || "Participation"), eventId: ObjectId.isValid(body.eventId) ? new ObjectId(body.eventId) : null, projectId: ObjectId.isValid(body.projectId) ? new ObjectId(body.projectId) : null, status: "issued", issuedAt: now, createdAt: now }
    const result = await db.collection("certificates").insertOne(certificate)
    await Promise.all([
      db.collection("activity_logs").insertOne({ memberId, type: "certificate_issued", certificateId: result.insertedId, title: certificate.title, createdAt: now }),
      addMemberNotification(db, memberId, { type: "certificate_available", title: "Certificate available", message: certificate.title, href: "/dashboard/certificates" }),
    ])
    return NextResponse.json({ success: true, data: { ...certificate, _id: result.insertedId.toString(), verifyUrl: `/verify/${code}` } }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to issue certificate" }, { status: 500 })
  }
}
