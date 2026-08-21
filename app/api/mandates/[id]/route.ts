import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

type Context = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, context: Context) {
  try {
    const params = await context.params
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 })
    }

    const body = await request.json()
    const { name, startYear, endYear, isCurrent } = body

    const update: Record<string, unknown> = { updated_at: new Date() }

    if (name !== undefined) update.name = name.toString().trim()
    if (startYear !== undefined) update.startYear = Number(startYear)
    if (endYear !== undefined) update.endYear = Number(endYear)
    if (isCurrent !== undefined) update.isCurrent = Boolean(isCurrent)

    if (update.name !== undefined && !update.name) {
      return NextResponse.json({ success: false, message: "Mandate name cannot be empty" }, { status: 400 })
    }

    const db = await getDb()

    if (isCurrent === true) {
      await db.collection("mandates").updateMany(
        { _id: { $ne: new ObjectId(id) } },
        { $set: { isCurrent: false } }
      )
    }

    const result = await db.collection("mandates").findOneAndUpdate(
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
      message: "Mandate updated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update mandate", error: String(error) },
      { status: 500 }
    )
  }
}
