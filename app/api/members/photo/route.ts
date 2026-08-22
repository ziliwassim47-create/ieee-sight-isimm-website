import { NextRequest, NextResponse } from "next/server"
import { GridFSBucket, ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"

const MAX_PHOTO_SIZE = 3 * 1024 * 1024

export async function POST(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response

  try {
    const formData = await request.formData()
    const photo = formData.get("photo")
    if (!(photo instanceof File) || !photo.type.startsWith("image/")) {
      return NextResponse.json({ success: false, message: "Choose a valid image file" }, { status: 400 })
    }
    if (photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ success: false, message: "The profile photo must be smaller than 3 MB" }, { status: 400 })
    }

    const db = await getDb()
    const bucket = new GridFSBucket(db, { bucketName: "event-images" })
    const memberId = new ObjectId(auth.member._id)
    const current = await db.collection("members").findOne({ _id: memberId }, { projection: { photoFileId: 1 } })
    const upload = bucket.openUploadStream(`member-${memberId}-${photo.name}`, { contentType: photo.type })
    upload.end(Buffer.from(await photo.arrayBuffer()))
    await new Promise<void>((resolve, reject) => {
      upload.on("finish", () => resolve())
      upload.on("error", reject)
    })

    const photoFileId = upload.id as ObjectId
    const photoUrl = `/api/upload/${photoFileId}`
    await db.collection("members").updateOne(
      { _id: memberId },
      { $set: { photoFileId, photoUrl, updatedAt: new Date() } }
    )
    if (current?.photoFileId && ObjectId.isValid(String(current.photoFileId))) {
      await bucket.delete(new ObjectId(String(current.photoFileId))).catch(() => undefined)
    }
    return NextResponse.json({ success: true, data: { photoUrl } })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to upload profile photo" }, { status: 500 })
  }
}
