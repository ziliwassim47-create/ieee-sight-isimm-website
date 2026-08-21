import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  try {
    const params = await context.params
    const id = params.id
    if (!id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 })

    const db = await getDb()
    const member = await db.collection("excom").findOne({ _id: new ObjectId(id) })
    if (!member) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: { ...member, _id: member._id.toString() },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch member", error: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const params = await context.params
    const id = params.id
    if (!id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 })

    const body = await request.json()
    const { name, position, customPosition, email, facebook, linkedin, imageUrl, order } = body

    const displayPosition = position === "Other" && customPosition ? customPosition : position
    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    }
    if (name !== undefined) update.name = name
    if (position !== undefined) update.position = position
    if (position === "Other") update.customPosition = customPosition
    if (displayPosition !== undefined) update.displayPosition = displayPosition
    if (email !== undefined) update.email = email
    if (facebook !== undefined) update.facebook = facebook
    if (linkedin !== undefined) update.linkedin = linkedin
    if (imageUrl !== undefined) update.imageUrl = imageUrl
    if (order !== undefined) update.order = order

    const db = await getDb()
    const result = await db.collection("excom").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    )
    if (!result) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    return NextResponse.json({
      success: true,
      data: { ...result, _id: result._id.toString() },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update member", error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const params = await context.params
    const id = params.id
    if (!id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 })

    const db = await getDb()
    const result = await db.collection("excom").deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete member", error: String(error) },
      { status: 500 }
    )
  }
}
