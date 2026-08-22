import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { authorizePlatform } from "@/lib/platform-permissions"
import { addMemberNotification } from "@/lib/member-notifications"

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "projects.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid project ID" }, { status: 400 })
  try {
    const db = await getDb()
    const members = await db.collection("project_members").aggregate([
      { $match: { projectId: new ObjectId(id), status: { $ne: "removed" } } },
      { $lookup: { from: "members", localField: "memberId", foreignField: "_id", as: "member" } },
      { $unwind: "$member" },
      { $project: { role: 1, status: 1, progress: 1, joinedAt: 1, "member._id": 1, "member.firstName": 1, "member.lastName": 1, "member.email": 1, "member.skills": 1 } },
    ]).toArray()
    return NextResponse.json({ success: true, data: members.map((item) => ({ ...item, _id: item._id.toString(), member: { ...item.member, _id: item.member._id.toString() } })) })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load project members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "projects.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid project ID" }, { status: 400 })
  try {
    const body = await request.json()
    if (!ObjectId.isValid(body.memberId)) return NextResponse.json({ success: false, message: "Invalid member ID" }, { status: 400 })
    const db = await getDb()
    const projectId = new ObjectId(id)
    const memberId = new ObjectId(body.memberId)
    const [project, member] = await Promise.all([db.collection("projects").findOne({ _id: projectId }), db.collection("members").findOne({ _id: memberId, status: "active" })])
    if (!project || !member) return NextResponse.json({ success: false, message: "Project or active member not found" }, { status: 404 })
    const now = new Date()
    const assignment = await db.collection("project_members").findOneAndUpdate(
      { projectId, memberId },
      { $set: { role: String(body.role || "Project Member"), status: "active", progress: Number(body.progress) || 0, updatedAt: now }, $setOnInsert: { joinedAt: now } },
      { upsert: true, returnDocument: "after" }
    )
    await db.collection("activity_logs").updateOne({ memberId, type: "project_joined", projectId }, { $set: { title: String(project.title), role: String(body.role || "Project Member"), createdAt: now } }, { upsert: true })
    await addMemberNotification(db, memberId, { type: "project_invitation", title: "New project assignment", message: `You joined ${project.title}`, href: "/dashboard/projects", projectId, dedupeKey: `project:${projectId}` })
    return NextResponse.json({ success: true, data: { ...assignment, _id: assignment?._id.toString() } }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to assign project member" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await authorizePlatform(request, "projects.manage")
  if (!auth.authorized) return auth.response
  const { id } = await context.params
  const memberId = new URL(request.url).searchParams.get("memberId") || ""
  if (!ObjectId.isValid(id) || !ObjectId.isValid(memberId)) return NextResponse.json({ success: false, message: "Invalid project or member ID" }, { status: 400 })
  try {
    const db = await getDb()
    const result = await db.collection("project_members").updateOne({ projectId: new ObjectId(id), memberId: new ObjectId(memberId) }, { $set: { status: "removed", updatedAt: new Date() } })
    if (!result.matchedCount) return NextResponse.json({ success: false, message: "Project member not found" }, { status: 404 })
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) }, { projection: { title: 1 } })
    await addMemberNotification(db, new ObjectId(memberId), { type: "project_assignment_removed", title: "Project assignment updated", message: `You are no longer assigned to ${project?.title || "this project"}.`, href: "/dashboard/projects", projectId: new ObjectId(id), dedupeKey: `project-removed:${id}` })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to remove project member" }, { status: 500 })
  }
}
