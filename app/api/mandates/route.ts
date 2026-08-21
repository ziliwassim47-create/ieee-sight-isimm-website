import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const mandates = await db
      .collection("mandates")
      .find({})
      .sort({ startYear: -1 })
      .toArray()
    const serialized = mandates.map((m: { _id?: unknown }) => ({
      ...m,
      _id: m._id?.toString?.() ?? m._id,
    }))
    return NextResponse.json({ success: true, data: serialized })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch mandates", error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, startYear, endYear, isCurrent } = body

    if (!name || !startYear || !endYear || typeof isCurrent !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Missing required fields: name, startYear, endYear, isCurrent" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const now = new Date()

    if (isCurrent) {
      await db.collection("mandates").updateMany({}, { $set: { isCurrent: false } })
    }

    const mandate = {
      name,
      startYear: Number(startYear),
      endYear: Number(endYear),
      isCurrent,
      created_at: now,
      updated_at: now,
    }
    const result = await db.collection("mandates").insertOne(mandate)
    return NextResponse.json({
      success: true,
      data: { ...mandate, _id: result.insertedId.toString() },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create mandate", error: String(error) },
      { status: 500 }
    )
  }
}
