import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"
import { serializeMember } from "@/lib/member-types"

const arrayFields = ["skills", "interests", "technologies", "sdgs"] as const
const textFields = ["firstName", "lastName", "university", "department", "studyLevel", "photoUrl", "linkedin", "github", "portfolio"] as const

export async function GET(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response) return auth.response
  return NextResponse.json({ success: true, data: auth.member })
}

export async function PUT(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response

  try {
    const body = await request.json()
    const update: Record<string, unknown> = { updatedAt: new Date() }
    for (const field of textFields) {
      if (body[field] !== undefined) update[field] = String(body[field]).trim()
    }
    for (const field of arrayFields) {
      if (body[field] !== undefined) {
        update[field] = Array.isArray(body[field])
          ? [...new Set(body[field].map((value: unknown) => String(value).trim()).filter(Boolean))].slice(0, 30)
          : []
      }
    }

    const db = await getDb()
    const result = await db.collection("members").findOneAndUpdate(
      { _id: new ObjectId(auth.member._id), status: "active" },
      { $set: update },
      { returnDocument: "after" }
    )
    if (!result) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: serializeMember(result) })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update member profile" }, { status: 500 })
  }
}
