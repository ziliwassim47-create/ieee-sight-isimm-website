import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"

export async function GET(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  try {
    const db = await getDb()
    const items = await db.collection("member_notifications").find({ memberId: new ObjectId(auth.member._id) }).sort({ createdAt: -1 }).limit(100).toArray()
    return NextResponse.json({ success: true, unread: items.filter((item) => !item.read).length, data: items.map((item) => ({ ...item, _id: item._id.toString() })) })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  try {
    const { id, all } = await request.json()
    const db = await getDb()
    const memberId = new ObjectId(auth.member._id)
    if (all) await db.collection("member_notifications").updateMany({ memberId, read: false }, { $set: { read: true, readAt: new Date() } })
    else if (ObjectId.isValid(id)) await db.collection("member_notifications").updateOne({ _id: new ObjectId(id), memberId }, { $set: { read: true, readAt: new Date() } })
    else return NextResponse.json({ success: false, message: "Notification ID is required" }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update notifications" }, { status: 500 })
  }
}
