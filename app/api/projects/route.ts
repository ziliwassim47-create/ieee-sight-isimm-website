import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

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

export async function GET() {
  try {
    const db = await getDb()
    const projects = await db
      .collection("projects")
      .find({})
      .sort({ date: -1, createdAt: -1 })
      .toArray()

    const serialized = projects.map((project: { _id?: unknown }) => ({
      ...project,
      _id: project._id?.toString?.() ?? project._id,
    }))

    return NextResponse.json({ success: true, data: serialized })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch projects", error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, date, projectType, customType, imageUrls, imageUrl, proposalFormUrl, status } = body

    if (!title || !description || !date || !projectType || !proposalFormUrl || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: title, description, date, projectType, proposalFormUrl, status" },
        { status: 400 }
      )
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Use Completed, In Progress, or Planned" },
        { status: 400 }
      )
    }

    const normalizedType = projectType === "Other" ? (customType ?? "").toString().trim() : projectType
    if (!normalizedType) {
      return NextResponse.json(
        { success: false, message: "Custom project type is required when projectType is Other" },
        { status: 400 }
      )
    }

    const normalizedProposalFormUrl = proposalFormUrl.toString().trim()
    if (!/^https?:\/\//i.test(normalizedProposalFormUrl)) {
      return NextResponse.json(
        { success: false, message: "proposalFormUrl must be a valid http/https URL" },
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
    const project = {
      title: title.toString().trim(),
      description: description.toString().trim(),
      date: date.toString(),
      projectType: projectType.toString(),
      customType: projectType === "Other" ? normalizedType : "",
      displayType: normalizedType,
      imageUrls: normalizedImageUrls,
      proposalFormUrl: normalizedProposalFormUrl,
      status: status as (typeof ALLOWED_STATUS)[number],
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("projects").insertOne(project)

    return NextResponse.json({
      success: true,
      data: { ...project, _id: result.insertedId.toString() },
      message: "Project created successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create project", error: String(error) },
      { status: 500 }
    )
  }
}
