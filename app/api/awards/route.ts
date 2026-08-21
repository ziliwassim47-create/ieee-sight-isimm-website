import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

const isValidImageUrl = (value: string) => /^https?:\/\//i.test(value) || value.startsWith("/")
const normalizeImageUrls = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => item?.toString?.().trim() ?? "")
      .filter((item) => item.length > 0)
  }

  const single = value?.toString?.().trim?.() ?? ""
  return single ? [single] : []
}

export async function GET() {
  try {
    const db = await getDb()
    const awards = await db
      .collection("awards")
      .find({})
      .sort({ year: -1, createdAt: -1 })
      .toArray()
    const serialized = awards.map((a: { _id?: unknown }) => ({
      ...a,
      _id: a._id?.toString?.() ?? a._id,
    }))
    return NextResponse.json({ success: true, data: serialized })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch awards", error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, year, description, imageUrls, imageUrl } = body

    if (!title || !year) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: title, year" },
        { status: 400 }
      )
    }

    const normalizedImageUrls = normalizeImageUrls(imageUrls ?? imageUrl)
    if (normalizedImageUrls.some((value) => !isValidImageUrl(value))) {
      return NextResponse.json(
        { success: false, message: "Each image URL must be a valid URL or internal path" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const now = new Date()
    const award = {
      title,
      year: Number(year),
      description: description || "",
      imageUrls: normalizedImageUrls,
      createdAt: now,
      updatedAt: now,
    }
    const result = await db.collection("awards").insertOne(award)
    return NextResponse.json({
      success: true,
      data: { ...award, _id: result.insertedId.toString() },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create award", error: String(error) },
      { status: 500 }
    )
  }
}
