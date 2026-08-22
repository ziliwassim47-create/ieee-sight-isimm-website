import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { authorizePlatform } from "@/lib/platform-permissions"
import { serializeMember } from "@/lib/member-types"
import { hashPassword } from "@/lib/password"
import { storeMemberCredential } from "@/lib/credential-vault"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(request: NextRequest) {
  const auth = await authorizePlatform(request, "members.manage")
  if (!auth.authorized) return auth.response

  try {
    const status = new URL(request.url).searchParams.get("status")
    const query = status && status !== "all" ? { status } : {}
    const db = await getDb()
    const members = await db.collection("members").find(query, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray()
    const memberIds = members.map((member) => member._id)
    const groupByMember = async (collection: string, match: Record<string, unknown>, value: Record<string, unknown>) => {
      if (!memberIds.length) return []
      return db.collection(collection).aggregate([
        { $match: { memberId: { $in: memberIds }, ...match } },
        { $group: { _id: "$memberId", ...value } },
      ]).toArray()
    }
    const [events, hours, projects, certificates, badges, achievements, scores] = await Promise.all([
      groupByMember("event_registrations", { attendanceStatus: "present" }, { total: { $sum: 1 } }),
      groupByMember("volunteer_hours", { status: "approved" }, { total: { $sum: "$hours" } }),
      groupByMember("project_members", { status: { $ne: "removed" } }, { total: { $sum: 1 } }),
      groupByMember("certificates", { status: "issued" }, { total: { $sum: 1 } }),
      groupByMember("member_badges", {}, { total: { $sum: 1 } }),
      groupByMember("member_achievements", {}, { total: { $sum: 1 } }),
      groupByMember("score_entries", {}, { total: { $sum: "$points" } }),
    ])
    const mapTotals = (items: Array<Record<string, unknown>>) => new Map(items.map((item) => [String(item._id), Number(item.total) || 0]))
    const eventMap = mapTotals(events)
    const hourMap = mapTotals(hours)
    const projectMap = mapTotals(projects)
    const certificateMap = mapTotals(certificates)
    const badgeMap = mapTotals(badges)
    const achievementMap = mapTotals(achievements)
    const scoreMap = mapTotals(scores)
    const data = members.map((member) => {
      const id = member._id.toString()
      const eventsAttended = eventMap.get(id) || 0
      const volunteerHours = hourMap.get(id) || 0
      const projectCount = projectMap.get(id) || 0
      return {
        ...serializeMember(member),
        stats: {
          eventsAttended,
          volunteerHours,
          projects: projectCount,
          certificates: certificateMap.get(id) || 0,
          badges: badgeMap.get(id) || 0,
          achievements: achievementMap.get(id) || 0,
          sightPoints: scoreMap.get(id) || 0,
        },
      }
    })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load members. Check MongoDB configuration." }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorizePlatform(request, "members.manage")
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const firstName = String(body.firstName || "").trim()
    const lastName = String(body.lastName || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")
    const ieeeMemberId = String(body.ieeeMemberId || "").trim()
    const university = String(body.university || "").trim()
    const department = String(body.department || "").trim()
    const studyLevel = String(body.studyLevel || "").trim()

    if (!firstName || !lastName || !emailPattern.test(email) || password.length < 8 || !ieeeMemberId || !university || !department || !studyLevel) {
      return NextResponse.json(
        { success: false, message: "Complete all fields with a valid email and a password of at least 8 characters" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const members = db.collection("members")
    await Promise.all([
      members.createIndex({ email: 1 }, { unique: true }),
      members.createIndex({ ieeeMemberId: 1 }, { unique: true }),
    ])
    const now = new Date()
    const member = {
      firstName,
      lastName,
      email,
      passwordHash: await hashPassword(password),
      ieeeMemberId,
      university,
      department,
      studyLevel,
      status: "active",
      role: "member",
      officerPosition: "",
      photoUrl: "",
      skills: [],
      interests: [],
      technologies: [],
      sdgs: [],
      linkedin: "",
      github: "",
      portfolio: "",
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
    }
    const result = await members.insertOne(member)
    await storeMemberCredential(db, result.insertedId, password, auth.member?._id ? new ObjectId(auth.member._id) : "bootstrap-admin")
    return NextResponse.json({ success: true, data: serializeMember({ ...member, _id: result.insertedId }) }, { status: 201 })
  } catch (error: unknown) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000
    return NextResponse.json(
      { success: false, message: duplicate ? "A member with this email or IEEE Member ID already exists" : "Failed to create member account" },
      { status: duplicate ? 409 : 500 }
    )
  }
}
