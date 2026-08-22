import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"

const serialize = (item: Record<string, any>) => ({
  ...item,
  _id: item._id?.toString?.() || String(item._id || ""),
  eventId: item.eventId?.toString?.() || item.eventId,
  memberId: undefined,
  event: item.event ? { ...item.event, _id: item.event._id?.toString?.() || String(item.event._id || "") } : undefined,
})

export async function GET(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  try {
    const db = await getDb()
    const memberId = new ObjectId(auth.member._id)
    const [registrations, upcomingEvents] = await Promise.all([
      db.collection("event_registrations").aggregate([
        { $match: { memberId, status: { $ne: "cancelled" } } },
        { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
        { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
        { $sort: { registeredAt: -1 } },
      ]).toArray(),
      db.collection("events").find({ eventType: "upcoming" }).sort({ date: 1 }).toArray(),
    ])
    return NextResponse.json({ success: true, data: { registrations: registrations.map(serialize), upcomingEvents: upcomingEvents.map(serialize) } })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load member events" }, { status: 500 })
  }
}
