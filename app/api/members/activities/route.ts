import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"

export async function GET(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  try {
    const db = await getDb()
    const items = await db.collection("activity_logs").find({ memberId: new ObjectId(auth.member._id) }).sort({ createdAt: -1 }).limit(200).toArray()
    return NextResponse.json({ success: true, data: items.map((item) => ({ ...item, _id: item._id.toString() })) })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load member activities" }, { status: 500 })
  }
}
