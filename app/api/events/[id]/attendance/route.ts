import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { authorizePlatform } from "@/lib/platform-permissions"
import { ATTENDANCE_SCORE_ACTIVITY, SCORE_POINTS_PER_ACTIVITY } from "@/lib/scoring"
import { addMemberNotification, getMemberScore, notifyMemberLevelChange } from "@/lib/member-notifications"

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "attendance.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })

  try {
    const db = await getDb()
    const registrations = await db.collection("event_registrations").aggregate([
      { $match: { eventId: new ObjectId(id), status: { $ne: "cancelled" } } },
      { $lookup: { from: "members", localField: "memberId", foreignField: "_id", as: "member" } },
      { $unwind: "$member" },
      { $project: { ticketCode: 1, status: 1, attendanceStatus: 1, registeredAt: 1, "member._id": 1, "member.firstName": 1, "member.lastName": 1, "member.email": 1, "member.ieeeMemberId": 1 } },
      { $sort: { registeredAt: 1 } },
    ]).toArray()
    return NextResponse.json({ success: true, data: registrations.map((item) => ({ ...item, _id: item._id.toString(), member: { ...item.member, _id: item.member._id.toString() } })) })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load attendance list" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "attendance.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })

  try {
    const body = await request.json()
    const eventId = new ObjectId(id)
    const status = body.status === "absent" ? "absent" : "present"
    const db = await getDb()
    const registration = body.ticketCode
      ? await db.collection("event_registrations").findOne({ eventId, ticketCode: String(body.ticketCode), status: { $ne: "cancelled" } })
      : ObjectId.isValid(body.memberId) ? await db.collection("event_registrations").findOne({ eventId, memberId: new ObjectId(body.memberId), status: { $ne: "cancelled" } }) : null
    if (!registration) return NextResponse.json({ success: false, message: "Valid event registration not found" }, { status: 404 })

    const now = new Date()
    const previousScore = await getMemberScore(db, registration.memberId)
    const event = await db.collection("events").findOne({ _id: eventId }, { projection: { title: 1 } })
    await Promise.all([
      db.collection("attendance").updateOne(
        { eventId, memberId: registration.memberId },
        { $set: { registrationId: registration._id, status, checkedAt: now, checkedBy: auth.member?._id ? new ObjectId(auth.member._id) : "bootstrap-admin", updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      ),
      db.collection("event_registrations").updateOne({ _id: registration._id }, { $set: { attendanceStatus: status, attendedAt: status === "present" ? now : null, updatedAt: now } }),
    ])
    if (status === "present") await db.collection("activity_logs").updateOne(
      { memberId: registration.memberId, type: "event_attendance", eventId },
      { $set: { title: "Event attendance", status: "completed", createdAt: now } },
      { upsert: true }
    )
    if (status === "present") {
      await db.collection("score_entries").updateOne(
        { memberId: registration.memberId, eventId, activityKey: ATTENDANCE_SCORE_ACTIVITY.key },
        {
          $set: {
            activityLabel: ATTENDANCE_SCORE_ACTIVITY.label,
            points: SCORE_POINTS_PER_ACTIVITY,
            comment: "Attendance confirmed by ExCom",
            contextTitle: "Event attendance",
            reviewAudience: "HR / ExCom",
            createdBy: auth.member?._id ? new ObjectId(auth.member._id) : "bootstrap-admin",
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      )
    } else {
      await db.collection("score_entries").deleteOne({ memberId: registration.memberId, eventId, activityKey: ATTENDANCE_SCORE_ACTIVITY.key })
    }
    await Promise.all([
      addMemberNotification(db, registration.memberId, {
        type: "attendance_updated",
        title: "Event attendance updated",
        message: `Your attendance for ${event?.title || "a SIGHT event"} was marked ${status}.`,
        href: "/dashboard/events",
        eventId,
        dedupeKey: `attendance:${eventId}`,
      }),
      notifyMemberLevelChange(db, registration.memberId, previousScore),
    ])
    return NextResponse.json({ success: true, message: `Attendance marked ${status}` })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update attendance" }, { status: 500 })
  }
}
