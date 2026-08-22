import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { GridFSBucket, ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { authorizePlatform } from "@/lib/platform-permissions"
import { serializeMember } from "@/lib/member-types"
import { ATTENDANCE_SCORE_ACTIVITY, EVENT_SCORE_ACTIVITIES, GENERAL_SCORE_ACTIVITIES, SCORE_POINTS_PER_ACTIVITY, getMemberLevel } from "@/lib/scoring"
import { addMemberNotification, getMemberScore, notifyMemberLevelChange } from "@/lib/member-notifications"

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "members.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid member ID" }, { status: 400 })

  try {
    const db = await getDb()
    const memberId = new ObjectId(id)
    const [member, registrations, projectMemberships, certificates, badges, achievements, scoreEntries, events, projects, awards] = await Promise.all([
      db.collection("members").findOne({ _id: memberId }, { projection: { passwordHash: 0 } }),
      db.collection("event_registrations").aggregate([
        { $match: { memberId, status: { $ne: "cancelled" } } },
        { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
        { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
        { $sort: { registeredAt: -1 } },
      ]).toArray(),
      db.collection("project_members").aggregate([
        { $match: { memberId, status: { $ne: "removed" } } },
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
        { $sort: { joinedAt: -1 } },
      ]).toArray(),
      db.collection("certificates").find({ memberId, status: "issued" }).sort({ issuedAt: -1 }).toArray(),
      db.collection("member_badges").find({ memberId }).sort({ awardedAt: -1 }).toArray(),
      db.collection("member_achievements").aggregate([
        { $match: { memberId } },
        { $lookup: { from: "awards", localField: "awardId", foreignField: "_id", as: "award" } },
        { $unwind: { path: "$award", preserveNullAndEmptyArrays: true } },
        { $sort: { awardedAt: -1 } },
      ]).toArray(),
      db.collection("score_entries").aggregate([
        { $match: { memberId } },
        { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
        { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
      ]).toArray(),
      db.collection("events").find({}, { projection: { title: 1, date: 1 } }).sort({ date: -1 }).toArray(),
      db.collection("projects").find({}, { projection: { title: 1, status: 1 } }).sort({ title: 1 }).toArray(),
      db.collection("awards").find({}, { projection: { title: 1, year: 1 } }).sort({ year: -1, title: 1 }).toArray(),
    ])
    if (!member) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })

    const score = scoreEntries.reduce((sum, entry) => sum + (Number(entry.points) || 0), 0)
    const serialize = (item: Record<string, unknown>) => ({ ...item, _id: item._id?.toString?.() ?? String(item._id || "") })

    return NextResponse.json({
      success: true,
      data: {
        member: serializeMember(member),
        score,
        memberLevel: getMemberLevel(score),
        scoreEntries: scoreEntries.map(serialize),
        registrations: registrations.map(serialize),
        projectMemberships: projectMemberships.map(serialize),
        certificates: certificates.map(serialize),
        badges: badges.map(serialize),
        achievements: achievements.map(serialize),
        options: { events: events.map(serialize), projects: projects.map(serialize), awards: awards.map(serialize) },
      },
    })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load member activity" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "members.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid member ID" }, { status: 400 })

  try {
    const body = await request.json()
    const action = String(body.action || "")
    const db = await getDb()
    const memberId = new ObjectId(id)
    const member = await db.collection("members").findOne({ _id: memberId })
    if (!member) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })
    const now = new Date()
    const previousScore = await getMemberScore(db, memberId)

    if (action === "event") {
      if (!ObjectId.isValid(body.eventId)) return NextResponse.json({ success: false, message: "Choose an event" }, { status: 400 })
      const eventId = new ObjectId(body.eventId)
      const event = await db.collection("events").findOne({ _id: eventId })
      if (!event) return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
      const selectedKeys = Array.isArray(body.scoreActivities) ? body.scoreActivities.map(String) : []
      const selectedActivities = EVENT_SCORE_ACTIVITIES.filter((activity) => selectedKeys.includes(activity.key))
      const comments = body.comments && typeof body.comments === "object" ? body.comments as Record<string, unknown> : {}
      const missingComments = selectedActivities.filter((activity) => !String(comments[activity.key] || "").trim())
      if (missingComments.length) return NextResponse.json({ success: false, message: "Add a comment for every selected participation activity" }, { status: 400 })
      const registration = await db.collection("event_registrations").findOneAndUpdate(
        { memberId, eventId },
        { $set: { status: "confirmed", attendanceStatus: "present", attendedAt: now, updatedAt: now }, $setOnInsert: { ticketCode: `MANUAL-${randomBytes(4).toString("hex").toUpperCase()}`, registeredAt: now } },
        { upsert: true, returnDocument: "after" }
      )
      const createdBy = auth.member?._id ? new ObjectId(auth.member._id) : "bootstrap-admin"
      const scoreOperations = [ATTENDANCE_SCORE_ACTIVITY, ...selectedActivities].map((activity) => db.collection("score_entries").updateOne(
        { memberId, eventId, activityKey: activity.key },
        {
          $set: {
            activityLabel: activity.label,
            points: SCORE_POINTS_PER_ACTIVITY,
            comment: activity.key === ATTENDANCE_SCORE_ACTIVITY.key ? String(body.attendanceComment || `Attendance confirmed for ${event.title}`).trim() : String(comments[activity.key] || "").trim(),
            contextTitle: String(event.title),
            reviewAudience: "HR / ExCom",
            createdBy,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      ))
      await Promise.all([
        db.collection("attendance").updateOne({ memberId, eventId }, { $set: { status: "present", checkedAt: now, checkedBy: auth.member?._id ? new ObjectId(auth.member._id) : "bootstrap-admin", updatedAt: now }, $setOnInsert: { registrationId: registration?._id, createdAt: now } }, { upsert: true }),
        db.collection("activity_logs").updateOne({ memberId, type: "event_attendance", eventId }, { $set: { title: String(event.title), status: "completed", createdAt: now } }, { upsert: true }),
        ...scoreOperations,
      ])
      await Promise.all([
        addMemberNotification(db, memberId, { type: "attendance_confirmed", title: "Event attendance confirmed", message: `Your presence at ${event.title} was confirmed by the ExCom.`, href: "/dashboard/events", eventId, dedupeKey: `attendance:${eventId}` }),
        notifyMemberLevelChange(db, memberId, previousScore),
      ])
      return NextResponse.json({ success: true, message: `Event attendance saved with ${1 + selectedActivities.length} scoring activit${selectedActivities.length ? "ies" : "y"}` })
    }

    if (action === "project") {
      if (!ObjectId.isValid(body.projectId)) return NextResponse.json({ success: false, message: "Choose a project" }, { status: 400 })
      const projectId = new ObjectId(body.projectId)
      const project = await db.collection("projects").findOne({ _id: projectId })
      if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
      await db.collection("project_members").updateOne(
        { memberId, projectId },
        { $set: { role: String(body.projectRole || "Project Member"), status: "active", updatedAt: now }, $unset: { progress: "" }, $setOnInsert: { joinedAt: now } },
        { upsert: true }
      )
      await db.collection("activity_logs").updateOne({ memberId, type: "project_joined", projectId }, { $set: { title: String(project.title), createdAt: now } }, { upsert: true })
      await addMemberNotification(db, memberId, { type: "project_assignment", title: "Project assignment updated", message: `You were assigned to ${project.title} as ${String(body.projectRole || "Project Member")}.`, href: "/dashboard/projects", projectId, dedupeKey: `project:${projectId}` })
      return NextResponse.json({ success: true, message: "Project added" })
    }

    if (action === "certificate") {
      const title = String(body.title || "").trim()
      if (!title) return NextResponse.json({ success: false, message: "Certificate title is required" }, { status: 400 })
      const certificate = { code: `SIGHT-ISIMM-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`, memberId, title, type: String(body.certificateType || "Participation"), status: "issued", issuedAt: now, createdAt: now }
      const result = await db.collection("certificates").insertOne(certificate)
      await addMemberNotification(db, memberId, { type: "certificate_available", title: "Certificate available", message: title, href: "/dashboard/certificates" })
      return NextResponse.json({ success: true, message: "Certificate issued", data: { ...certificate, _id: result.insertedId.toString() } })
    }

    if (action === "badge") {
      const name = String(body.name || "").trim()
      if (!name) return NextResponse.json({ success: false, message: "Badge name is required" }, { status: 400 })
      await db.collection("member_badges").updateOne(
        { memberId, name },
        { $set: { description: String(body.description || "").trim(), awardedAt: now, updatedAt: now }, $unset: { points: "" }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      )
      await addMemberNotification(db, memberId, { type: "badge_awarded", title: "New badge awarded", message: `You received the ${name} badge.`, href: "/dashboard/achievements", dedupeKey: `badge:${name.toLowerCase()}` })
      return NextResponse.json({ success: true, message: "Badge added" })
    }

    if (action === "achievement") {
      if (!ObjectId.isValid(body.awardId)) return NextResponse.json({ success: false, message: "Choose an award" }, { status: 400 })
      const awardId = new ObjectId(body.awardId)
      const award = await db.collection("awards").findOne({ _id: awardId })
      if (!award) return NextResponse.json({ success: false, message: "Award not found" }, { status: 404 })
      await db.collection("member_achievements").updateOne(
        { memberId, awardId },
        { $set: { title: String(award.title), contribution: String(body.contribution || "").trim(), awardedAt: now, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      )
      await addMemberNotification(db, memberId, { type: "achievement_awarded", title: "New achievement", message: `Your contribution to ${award.title} was added to your profile.`, href: "/dashboard/achievements", dedupeKey: `achievement:${awardId}` })
      return NextResponse.json({ success: true, message: "Achievement added" })
    }

    if (action === "score_activities") {
      const selectedKeys = Array.isArray(body.scoreActivities) ? body.scoreActivities.map(String) : []
      const selectedActivities = GENERAL_SCORE_ACTIVITIES.filter((activity) => selectedKeys.includes(activity.key))
      if (!selectedActivities.length) return NextResponse.json({ success: false, message: "Choose at least one scoring activity" }, { status: 400 })
      const comments = body.comments && typeof body.comments === "object" ? body.comments as Record<string, unknown> : {}
      const missingComments = selectedActivities.filter((activity) => !String(comments[activity.key] || "").trim())
      if (missingComments.length) return NextResponse.json({ success: false, message: "Add a comment for every selected scoring activity" }, { status: 400 })
      const createdBy = auth.member?._id ? new ObjectId(auth.member._id) : "bootstrap-admin"
      await db.collection("score_entries").insertMany(selectedActivities.map((activity) => ({
        memberId,
        activityKey: activity.key,
        activityLabel: activity.label,
        points: SCORE_POINTS_PER_ACTIVITY,
        comment: String(comments[activity.key]).trim(),
        reviewAudience: "HR / ExCom",
        createdBy,
        createdAt: now,
        updatedAt: now,
      })))
      await notifyMemberLevelChange(db, memberId, previousScore)
      return NextResponse.json({ success: true, message: `${selectedActivities.length * SCORE_POINTS_PER_ACTIVITY} points added from ${selectedActivities.length} activities` })
    }

    return NextResponse.json({ success: false, message: "Unsupported activity action" }, { status: 400 })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update member activity" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "members.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid member ID" }, { status: 400 })
  const memberId = new ObjectId(id)
  const url = new URL(request.url)
  const type = url.searchParams.get("type")
  const itemId = url.searchParams.get("itemId") || ""
  if (!ObjectId.isValid(itemId)) return NextResponse.json({ success: false, message: "Invalid activity ID" }, { status: 400 })

  try {
    const db = await getDb()
    const previousScore = await getMemberScore(db, memberId)
    const _id = new ObjectId(itemId)
    if (type === "event") {
      const registration = await db.collection("event_registrations").findOne({ _id, memberId })
      if (registration) await Promise.all([
        db.collection("event_registrations").deleteOne({ _id, memberId }),
        db.collection("attendance").deleteOne({ memberId, eventId: registration.eventId }),
        db.collection("activity_logs").deleteOne({ memberId, type: "event_attendance", eventId: registration.eventId }),
        db.collection("score_entries").deleteMany({ memberId, eventId: registration.eventId }),
      ])
    }
    else if (type === "project") {
      const membership = await db.collection("project_members").findOne({ _id, memberId })
      if (membership) await Promise.all([
        db.collection("project_members").updateOne({ _id, memberId }, { $set: { status: "removed", updatedAt: new Date() } }),
        db.collection("activity_logs").deleteOne({ memberId, type: "project_joined", projectId: membership.projectId }),
      ])
    }
    else if (type === "certificate") {
      const certificate = await db.collection("certificates").findOne({ _id, memberId })
      await db.collection("certificates").deleteOne({ _id, memberId })
      if (certificate?.fileId && ObjectId.isValid(String(certificate.fileId))) {
        const bucket = new GridFSBucket(db, { bucketName: "certificate-files" })
        await bucket.delete(new ObjectId(String(certificate.fileId))).catch(() => undefined)
      }
    }
    else if (type === "badge") await db.collection("member_badges").deleteOne({ _id, memberId })
    else if (type === "achievement") await db.collection("member_achievements").deleteOne({ _id, memberId })
    else if (type === "score_entry") await db.collection("score_entries").deleteOne({ _id, memberId })
    else return NextResponse.json({ success: false, message: "Unsupported activity type" }, { status: 400 })
    if (type === "event" || type === "score_entry") await notifyMemberLevelChange(db, memberId, previousScore)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to remove member activity" }, { status: 500 })
  }
}
