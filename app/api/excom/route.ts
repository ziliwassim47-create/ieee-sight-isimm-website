import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mandateId = searchParams.get("mandate")
    const mandateIdParam = searchParams.get("mandateId")

    const db = await getDb()
    let mandateIdToUse = mandateId || mandateIdParam

    if (!mandateIdToUse) {
      const currentMandate = await db.collection("mandates").findOne({ isCurrent: true })
      mandateIdToUse = currentMandate?._id?.toString() ?? null
      if (!mandateIdToUse) {
        const latestMandate = await db
          .collection("mandates")
          .findOne({}, { sort: { startYear: -1 } })
        mandateIdToUse = latestMandate?._id?.toString() ?? null
      }
    }

    const query = mandateIdToUse ? { mandateId: mandateIdToUse } : {}
    const members = await db
      .collection("excom")
      .find(query)
      .sort({ order: 1, createdAt: 1 })
      .toArray()

    const serialized = members.map((m: { _id?: unknown; mandateId?: unknown }) => ({
      ...m,
      _id: m._id?.toString(),
      mandateId: m.mandateId?.toString?.() ?? m.mandateId,
    }))

    return NextResponse.json({ success: true, data: serialized })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch excom members", error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mandateId, name, position, customPosition, email, facebook, linkedin, imageUrl, order } = body

    if (!mandateId || !name || !position || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: mandateId, name, position, email" },
        { status: 400 }
      )
    }

    const displayPosition = position === "Other" && customPosition ? customPosition : position

    const db = await getDb()
    const now = new Date()
    const member = {
      mandateId,
      name,
      position,
      customPosition: position === "Other" ? customPosition : undefined,
      displayPosition,
      email,
      facebook: facebook || "",
      linkedin: linkedin || "",
      imageUrl: imageUrl || "",
      order: order ?? 999,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("excom").insertOne(member)
    return NextResponse.json({
      success: true,
      data: { ...member, _id: result.insertedId.toString() },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create excom member", error: String(error) },
      { status: 500 }
    )
  }
}
