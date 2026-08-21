import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body?.email ?? "").toString().trim().toLowerCase()

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const col = db.collection("newsletter")
    const existing = await col.findOne({ email })
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You're already subscribed!",
      })
    }

    const now = new Date()
    await col.insertOne({
      email,
      subscribedAt: now,
    })

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing to our newsletter!",
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to subscribe", error: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const db = await getDb()
    const subscribers = await db
      .collection("newsletter")
      .find({})
      .sort({ subscribedAt: -1 })
      .toArray()
    const serialized = subscribers.map((s: { _id?: unknown; subscribedAt?: Date }) => ({
      ...s,
      _id: s._id?.toString?.() ?? s._id,
      subscribedAt: s.subscribedAt instanceof Date ? s.subscribedAt.toISOString() : s.subscribedAt,
    }))
    return NextResponse.json({ success: true, data: serialized })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch subscribers", error: String(error) },
      { status: 500 }
    )
  }
}
