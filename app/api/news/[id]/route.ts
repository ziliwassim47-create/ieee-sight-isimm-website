import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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

type Context = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, context: Context) {
  try {
    const params = await context.params
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 })
    }

    const body = await request.json()
    const { title, summary, date, category, imageUrls, imageUrl, link, linkLabel, isPinned, hasDeadline, deadlineDate } = body

    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (title !== undefined) update.title = title.toString().trim()
    if (summary !== undefined) update.summary = summary.toString().trim()
    if (date !== undefined) update.date = date.toString()

    if (category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return NextResponse.json({ success: false, message: "Invalid category" }, { status: 400 })
      }
      update.category = category
    }

    if (link !== undefined) {
      const normalizedLink = link.toString().trim()
      if (normalizedLink && !isValidUrl(normalizedLink)) {
        return NextResponse.json(
          { success: false, message: "link must be a valid http/https URL" },
          { status: 400 }
        )
      }
      update.link = normalizedLink
    }

    if (imageUrls !== undefined || imageUrl !== undefined) {
      const normalizedImageUrls = normalizeImageUrls(imageUrls ?? imageUrl)
      if (normalizedImageUrls.some((value) => !isValidImageUrl(value))) {
        return NextResponse.json(
          { success: false, message: "Each image URL must be a valid URL or internal path" },
          { status: 400 }
        )
      }
      update.imageUrls = normalizedImageUrls
    }

    if (linkLabel !== undefined) {
      update.linkLabel = linkLabel.toString().trim() || "Learn More"
    }

    if (isPinned !== undefined) {
      update.isPinned = Boolean(isPinned)
    }

    if (hasDeadline !== undefined) {
      const normalizedHasDeadline = Boolean(hasDeadline)
      update.hasDeadline = normalizedHasDeadline

      if (normalizedHasDeadline) {
        const normalizedDeadlineDate = (deadlineDate ?? "").toString().trim()
        if (!normalizedDeadlineDate) {
          return NextResponse.json(
            { success: false, message: "deadlineDate is required when hasDeadline is true" },
            { status: 400 }
          )
        }
        update.deadlineDate = normalizedDeadlineDate
      } else {
        update.deadlineDate = ""
      }
    } else if (deadlineDate !== undefined) {
      const normalizedDeadlineDate = deadlineDate.toString().trim()
      if (normalizedDeadlineDate) {
        update.deadlineDate = normalizedDeadlineDate
      }
    }

    const db = await getDb()
    const result = await db.collection("news").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { ...result, _id: result._id.toString() },
      message: "News item updated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update news item", error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const params = await context.params
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.collection("news").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "News item deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete news item", error: String(error) },
      { status: 500 }
    )
  }
}
