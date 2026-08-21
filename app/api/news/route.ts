import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

const ALLOWED_CATEGORIES = [
  "Announcement",
  "Opportunity",
  "Impact Story",
  "Partnership",
  "Call for Volunteers",
  "Event Update",
] as const

const isValidUrl = (value: string) => /^https?:\/\//i.test(value)
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
    const news = await db
      .collection("news")
      .find({})
      .sort({ isPinned: -1, date: -1, createdAt: -1 })
      .toArray()

    const serialized = news.map((item: { _id?: unknown }) => ({
      ...item,
      _id: item._id?.toString?.() ?? item._id,
    }))

    return NextResponse.json({ success: true, data: serialized })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch news", error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, summary, date, category, imageUrls, imageUrl, link, linkLabel, isPinned, hasDeadline, deadlineDate } = body

    if (!title || !summary || !date || !category) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: title, summary, date, category" },
        { status: 400 }
      )
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid category" },
        { status: 400 }
      )
    }

    const normalizedLink = (link ?? "").toString().trim()
    if (normalizedLink && !isValidUrl(normalizedLink)) {
      return NextResponse.json(
        { success: false, message: "link must be a valid http/https URL" },
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

    const normalizedHasDeadline = Boolean(hasDeadline)
    const normalizedDeadlineDate = (deadlineDate ?? "").toString().trim()
    if (normalizedHasDeadline && !normalizedDeadlineDate) {
      return NextResponse.json(
        { success: false, message: "deadlineDate is required when hasDeadline is true" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const now = new Date()
    const item = {
      title: title.toString().trim(),
      summary: summary.toString().trim(),
      date: date.toString(),
      category: category as (typeof ALLOWED_CATEGORIES)[number],
      imageUrls: normalizedImageUrls,
      link: normalizedLink,
      linkLabel: (linkLabel ?? "Learn More").toString().trim() || "Learn More",
      isPinned: Boolean(isPinned),
      hasDeadline: normalizedHasDeadline,
      deadlineDate: normalizedHasDeadline ? normalizedDeadlineDate : "",
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("news").insertOne(item)

    return NextResponse.json({
      success: true,
      data: { ...item, _id: result.insertedId.toString() },
      message: "News item created successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create news item", error: String(error) },
      { status: 500 }
    )
  }
}
