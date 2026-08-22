import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { GridFSBucket, ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { authorizePlatform } from "@/lib/platform-permissions"
import { addMemberNotification } from "@/lib/member-notifications"

type Context = { params: Promise<{ id: string }> }
const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"])
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "certificates.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid member ID" }, { status: 400 })

  let uploadedFileId: ObjectId | null = null
  try {
    const data = await request.formData()
    const title = String(data.get("title") || "").trim()
    const type = String(data.get("type") || "Participation").trim()
    const file = data.get("file")
    if (!title || !(file instanceof File)) return NextResponse.json({ success: false, message: "Certificate title and file are required" }, { status: 400 })
    if (!allowedTypes.has(file.type)) return NextResponse.json({ success: false, message: "Certificate must be a PDF, PNG, JPG or WebP file" }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, message: "Certificate file must be smaller than 10 MB" }, { status: 400 })

    const db = await getDb()
    const memberId = new ObjectId(id)
    const member = await db.collection("members").findOne({ _id: memberId })
    if (!member) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })

    const bucket = new GridFSBucket(db, { bucketName: "certificate-files" })
    const upload = bucket.openUploadStream(file.name, { contentType: file.type, metadata: { memberId, title } })
    upload.end(Buffer.from(await file.arrayBuffer()))
    await new Promise<void>((resolve, reject) => {
      upload.on("finish", () => resolve())
      upload.on("error", reject)
    })
    uploadedFileId = upload.id as ObjectId

    const now = new Date()
    const certificate = {
      code: `SIGHT-ISIMM-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`,
      memberId,
      title,
      type,
      fileId: uploadedFileId,
      fileName: file.name,
      mimeType: file.type,
      status: "issued",
      issuedAt: now,
      createdAt: now,
    }
    const result = await db.collection("certificates").insertOne(certificate)
    await Promise.all([
      db.collection("activity_logs").insertOne({ memberId, type: "certificate_issued", certificateId: result.insertedId, title, createdAt: now }),
      addMemberNotification(db, memberId, { type: "certificate_available", title: "Certificate available", message: title, href: "/dashboard/certificates" }),
    ])
    return NextResponse.json({ success: true, data: { ...certificate, _id: result.insertedId.toString(), downloadUrl: `/api/certificates/${result.insertedId}/download` } }, { status: 201 })
  } catch {
    if (uploadedFileId) {
      try {
        const db = await getDb()
        await new GridFSBucket(db, { bucketName: "certificate-files" }).delete(uploadedFileId)
      } catch {}
    }
    return NextResponse.json({ success: false, message: "Failed to upload certificate" }, { status: 500 })
  }
}
