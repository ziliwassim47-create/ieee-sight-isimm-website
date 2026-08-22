import { NextRequest } from "next/server"
import ExcelJS from "exceljs"
import { getDb } from "@/lib/mongodb"
import { authorizePlatform } from "@/lib/platform-permissions"
import { ALL_SCORE_ACTIVITIES, SCORE_POINTS_PER_ACTIVITY, getMemberLevel } from "@/lib/scoring"

const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } } as const

function styleSheet(worksheet: ExcelJS.Worksheet) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }]
  worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: worksheet.columnCount } }
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
  worksheet.getRow(1).fill = headerFill
  worksheet.getRow(1).alignment = { vertical: "middle" }
  worksheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "middle", wrapText: true }
    if (rowNumber > 1 && rowNumber % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } }
  })
}

export async function GET(request: NextRequest) {
  const auth = await authorizePlatform(request, "statistics.view")
  if (!auth.authorized) return auth.response

  try {
    const db = await getDb()
    const [members, scores, events, projects, certificates, badges, achievements, scoreEntries] = await Promise.all([
      db.collection("members").find({}, { projection: { passwordHash: 0 } }).sort({ lastName: 1, firstName: 1 }).toArray(),
      db.collection("score_entries").aggregate([{ $group: { _id: "$memberId", total: { $sum: "$points" } } }]).toArray(),
      db.collection("event_registrations").aggregate([{ $match: { attendanceStatus: "present" } }, { $group: { _id: "$memberId", total: { $sum: 1 } } }]).toArray(),
      db.collection("project_members").aggregate([{ $match: { status: { $ne: "removed" } } }, { $group: { _id: "$memberId", total: { $sum: 1 } } }]).toArray(),
      db.collection("certificates").aggregate([{ $match: { status: "issued" } }, { $group: { _id: "$memberId", total: { $sum: 1 } } }]).toArray(),
      db.collection("member_badges").aggregate([{ $group: { _id: "$memberId", total: { $sum: 1 } } }]).toArray(),
      db.collection("member_achievements").aggregate([{ $group: { _id: "$memberId", total: { $sum: 1 } } }]).toArray(),
      db.collection("score_entries").aggregate([
        { $lookup: { from: "members", localField: "memberId", foreignField: "_id", as: "member" } },
        { $unwind: "$member" },
        { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
        { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "members", localField: "createdBy", foreignField: "_id", as: "reviewer" } },
        { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
      ]).toArray(),
    ])

    const totals = (items: Array<Record<string, unknown>>) => new Map(items.map((item) => [String(item._id), Number(item.total) || 0]))
    const scoreMap = totals(scores)
    const eventMap = totals(events)
    const projectMap = totals(projects)
    const certificateMap = totals(certificates)
    const badgeMap = totals(badges)
    const achievementMap = totals(achievements)

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "IEEE SIGHT ISIMM ExCom"
    workbook.created = new Date()

    const summary = workbook.addWorksheet("Member Summary")
    summary.columns = [
      { header: "Full Name", key: "fullName", width: 30 },
      { header: "IEEE Member ID", key: "ieeeMemberId", width: 20 },
      { header: "Email", key: "email", width: 38 },
      { header: "Status", key: "status", width: 14 },
      { header: "University", key: "university", width: 22 },
      { header: "Department", key: "department", width: 32 },
      { header: "Study Level", key: "studyLevel", width: 24 },
      { header: "Final Score", key: "score", width: 14 },
      { header: "Member Level", key: "level", width: 24 },
      { header: "Events Attended", key: "events", width: 18 },
      { header: "Projects", key: "projects", width: 12 },
      { header: "Certificates", key: "certificates", width: 14 },
      { header: "Badges", key: "badges", width: 10 },
      { header: "Achievements", key: "achievements", width: 14 },
    ]
    summary.addRows(members.map((member) => {
      const id = String(member._id)
      const score = scoreMap.get(id) || 0
      return {
        fullName: [member.firstName, member.middleName, member.lastName].filter(Boolean).join(" "),
        ieeeMemberId: member.ieeeMemberId,
        email: member.email,
        status: member.status,
        university: member.university,
        department: member.department,
        studyLevel: member.studyLevel,
        score,
        level: getMemberLevel(score),
        events: eventMap.get(id) || 0,
        projects: projectMap.get(id) || 0,
        certificates: certificateMap.get(id) || 0,
        badges: badgeMap.get(id) || 0,
        achievements: achievementMap.get(id) || 0,
      }
    }))
    summary.getColumn("ieeeMemberId").numFmt = "@"
    styleSheet(summary)

    const details = workbook.addWorksheet("Private Scoring Details")
    details.columns = [
      { header: "Full Name", key: "fullName", width: 30 },
      { header: "IEEE Member ID", key: "ieeeMemberId", width: 20 },
      { header: "Email", key: "email", width: 36 },
      { header: "Activity", key: "activity", width: 52 },
      { header: "Context / Event", key: "context", width: 32 },
      { header: "Points", key: "points", width: 10 },
      { header: "HR / ExCom Comment", key: "comment", width: 60 },
      { header: "Added By", key: "reviewer", width: 28 },
      { header: "Date", key: "date", width: 22 },
    ]
    details.addRows(scoreEntries.map((entry) => ({
      fullName: [entry.member?.firstName, entry.member?.middleName, entry.member?.lastName].filter(Boolean).join(" "),
      ieeeMemberId: entry.member?.ieeeMemberId,
      email: entry.member?.email,
      activity: entry.activityLabel,
      context: entry.event?.title || entry.contextTitle || "General contribution",
      points: Number(entry.points) || SCORE_POINTS_PER_ACTIVITY,
      comment: entry.comment || "",
      reviewer: entry.reviewer ? [entry.reviewer.firstName, entry.reviewer.lastName].filter(Boolean).join(" ") : String(entry.createdBy || "Admin"),
      date: entry.createdAt ? new Date(entry.createdAt).toISOString() : "",
    })))
    details.getColumn("ieeeMemberId").numFmt = "@"
    styleSheet(details)

    const rules = workbook.addWorksheet("Scoring Rules")
    rules.columns = [
      { header: "Activity", key: "activity", width: 64 },
      { header: "Points", key: "points", width: 12 },
    ]
    rules.addRows(ALL_SCORE_ACTIVITIES.map((activity) => ({ activity: activity.label, points: SCORE_POINTS_PER_ACTIVITY })))
    styleSheet(rules)

    const levels = workbook.addWorksheet("Member Levels")
    levels.columns = [
      { header: "Score", key: "score", width: 18 },
      { header: "Level", key: "level", width: 28 },
    ]
    levels.addRows([
      { score: "0–9", level: "Member" },
      { score: "12–24", level: "Active Member" },
      { score: "27–39", level: "Bronze Member" },
      { score: "42–60", level: "Silver Member" },
      { score: "63–90", level: "Gold Member" },
      { score: "93+", level: "Changemaker Member" },
    ])
    styleSheet(levels)

    const output = await workbook.xlsx.writeBuffer()
    const filename = `sight-isimm-scoring-${new Date().toISOString().slice(0, 10)}.xlsx`
    return new Response(new Uint8Array(output), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return Response.json({ success: false, message: "Failed to generate the scoring workbook" }, { status: 500 })
  }
}
