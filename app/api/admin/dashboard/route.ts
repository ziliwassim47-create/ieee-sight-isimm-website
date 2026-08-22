import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { authorizePlatform } from "@/lib/platform-permissions"

export async function GET(request: NextRequest) {
  const auth = await authorizePlatform(request, "statistics.view")
  if (!auth.authorized) return auth.response
  try {
    const db = await getDb()
    const [members, ieeeMembers, activeMembers, events, projects, hours, attendance, membersByMonth, projectsBySdg] = await Promise.all([
      db.collection("members").countDocuments(),
      db.collection("members").countDocuments({ ieeeMemberId: { $nin: ["", null] } }),
      db.collection("members").countDocuments({ status: "active" }),
      db.collection("events").countDocuments(),
      db.collection("projects").countDocuments(),
      db.collection("volunteer_hours").aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, total: { $sum: "$hours" } } }]).toArray(),
      db.collection("event_registrations").aggregate([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: "$attendanceStatus", total: { $sum: 1 } } }]).toArray(),
      db.collection("members").aggregate([{ $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $limit: 24 }]).toArray(),
      db.collection("projects").aggregate([{ $unwind: { path: "$sdgs", preserveNullAndEmptyArrays: false } }, { $group: { _id: "$sdgs", total: { $sum: 1 } } }, { $sort: { total: -1 } }]).toArray(),
    ])
    const attendanceTotals = Object.fromEntries(attendance.map((item) => [String(item._id || "not_checked"), Number(item.total) || 0]))
    return NextResponse.json({ success: true, data: { kpis: { members, ieeeMembers, activeMembers, events, projects, volunteerHours: hours[0]?.total || 0 }, membershipEvolution: membersByMonth.map((item) => ({ month: item._id, members: item.total })), attendance: attendanceTotals, projectsBySdg: projectsBySdg.map((item) => ({ sdg: item._id, projects: item.total })) } })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load platform statistics" }, { status: 500 })
  }
}
