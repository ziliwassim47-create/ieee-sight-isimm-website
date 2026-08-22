import { NextRequest } from "next/server"
import { GridFSBucket, ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return new Response("Invalid certificate ID", { status: 400 })

  try {
    const db = await getDb()
    const certificate = await db.collection("certificates").findOne({ _id: new ObjectId(id), memberId: new ObjectId(auth.member._id), status: "issued" })
    if (!certificate?.fileId || !ObjectId.isValid(String(certificate.fileId))) return new Response("Certificate file not found", { status: 404 })
    const fileId = new ObjectId(String(certificate.fileId))
    const file = await db.collection("certificate-files.files").findOne({ _id: fileId })
    if (!file) return new Response("Certificate file not found", { status: 404 })
    const safeName = String(certificate.fileName || file.filename || "certificate.pdf").replace(/[^a-zA-Z0-9._-]/g, "-")
    const stream = new GridFSBucket(db, { bucketName: "certificate-files" }).openDownloadStream(fileId)
    return new Response(stream as never, {
      headers: {
        "Content-Type": String(certificate.mimeType || file.contentType || "application/octet-stream"),
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return new Response("Failed to download certificate", { status: 500 })
  }
}
