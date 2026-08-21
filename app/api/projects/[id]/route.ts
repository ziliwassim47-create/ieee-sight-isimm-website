import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const ALLOWED_STATUS = ["Completed", "In Progress", "Planned"] as const
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

export async function GET(request: NextRequest, context: Context) {
  try {
    const params = await context.params
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 })
    }

    const db = await getDb()
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) })
    if (!project) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { ...project, _id: project._id.toString() },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch project", error: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const params = await context.params
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 })
    }

    const body = await request.json()
    const { title, description, date, projectType, customType, imageUrls, imageUrl, proposalFormUrl, status } = body

    const update: Record<string, unknown> = { updatedAt: new Date() }

    if (title !== undefined) update.title = title.toString().trim()
    if (description !== undefined) update.description = description.toString().trim()
    if (date !== undefined) update.date = date.toString()
    if (proposalFormUrl !== undefined) {
      const normalizedProposalFormUrl = proposalFormUrl.toString().trim()
      if (!normalizedProposalFormUrl || !/^https?:\/\//i.test(normalizedProposalFormUrl)) {
        return NextResponse.json(
          { success: false, message: "proposalFormUrl must be a valid http/https URL" },
          { status: 400 }
        )
      }
      update.proposalFormUrl = normalizedProposalFormUrl
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
    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status. Use Completed, In Progress, or Planned" },
          { status: 400 }
        )
      }
      update.status = status
    }

    const nextProjectType = projectType !== undefined ? projectType.toString() : undefined
    const nextCustomType = customType !== undefined ? customType.toString().trim() : undefined

    if (nextProjectType !== undefined) {
      update.projectType = nextProjectType
    }

    if (nextProjectType === "Other") {
      if (!nextCustomType) {
        return NextResponse.json(
          { success: false, message: "Custom project type is required when projectType is Other" },
          { status: 400 }
        )
      }
      update.customType = nextCustomType
      update.displayType = nextCustomType
    } else if (nextProjectType !== undefined) {
      update.customType = ""
      update.displayType = nextProjectType
    } else if (nextCustomType !== undefined) {
      update.customType = nextCustomType
      update.displayType = nextCustomType
    }

    const db = await getDb()
    const result = await db.collection("projects").findOneAndUpdate(
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
      message: "Project updated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update project", error: String(error) },
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
    const result = await db.collection("projects").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Project deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete project", error: String(error) },
      { status: 500 }
    )
  }
}
