import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"
import { getMemberLevel } from "@/lib/scoring"

export async function GET(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response

  try {
    const db = await getDb()
    const memberId = new ObjectId(auth.member._id)
    const [eventsAttended, hoursResult, projectCount, certificateCount, badgeCount, achievementCount, scoreResult, notifications, projectMemberships] = await Promise.all([
      db.collection("event_registrations").countDocuments({ memberId, attendanceStatus: "present" }),
      db.collection("volunteer_hours").aggregate<{ total: number }>([
        { $match: { memberId, status: "approved" } },
        { $group: { _id: null, total: { $sum: "$hours" } } },
      ]).toArray(),
      db.collection("project_members").countDocuments({ memberId, status: { $ne: "removed" } }),
      db.collection("certificates").countDocuments({ memberId, status: "issued" }),
      db.collection("member_badges").countDocuments({ memberId }),
      db.collection("member_achievements").countDocuments({ memberId }),
      db.collection("score_entries").aggregate<{ total: number }>([
        { $match: { memberId } },
        { $group: { _id: null, total: { $sum: "$points" } } },
      ]).toArray(),
      db.collection("member_notifications").find({ memberId }).sort({ createdAt: -1 }).limit(5).toArray(),
      db.collection("project_members").find({ memberId, status: { $ne: "removed" } }).limit(4).toArray(),
    ])

    const projectIds = projectMemberships.map((item) => item.projectId).filter(Boolean)
    const projects = projectIds.length ? await db.collection("projects").find({ _id: { $in: projectIds } }).toArray() : []
    const nextEvent = await db.collection("events").find({ eventType: "upcoming", date: { $gte: new Date().toISOString().slice(0, 10) } }).sort({ date: 1 }).limit(1).next()
    const volunteerHours = hoursResult[0]?.total || 0
    const sightPoints = scoreResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: {
        member: auth.member,
        memberLevel: getMemberLevel(sightPoints),
        kpis: {
          eventsAttended,
          volunteerHours,
          projects: projectCount,
          certificates: certificateCount,
          badges: badgeCount,
          achievements: achievementCount,
          sightPoints,
        },
        nextEvent: nextEvent ? { ...nextEvent, _id: nextEvent._id.toString() } : null,
        projects: projects.map((project) => ({ ...project, _id: project._id.toString() })),
        notifications: notifications.map((notification) => ({ ...notification, _id: notification._id.toString() })),
      },
    })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load member dashboard" }, { status: 500 })
  }
}
