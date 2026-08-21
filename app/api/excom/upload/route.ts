import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { GridFSBucket } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, message: "Only image files are allowed" }, { status: 400 })
    }

    const maxSize = 30 * 1024 * 1024 // 30MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, message: "File size must be less than 30MB" }, { status: 400 })
    }

    const db = await getDb()
    const bucket = new GridFSBucket(db, { bucketName: "excom-images" })
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const uploadStream = bucket.openUploadStream(file.name, { contentType: file.type })
    uploadStream.end(buffer)

    await new Promise<void>((resolve, reject) => {
      uploadStream.on("finish", () => resolve())
      uploadStream.on("error", reject)
    })

    const id = uploadStream.id.toString()
    const url = `/api/excom/image/${id}`

    return NextResponse.json({ success: true, url, id, filename: file.name })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Upload failed", error: String(error) },
      { status: 500 }
    )
  }
}
