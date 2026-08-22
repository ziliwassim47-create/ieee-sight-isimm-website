import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"

export async function GET(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  try {
    const db = await getDb()
    const items = await db.collection("project_members").aggregate([
      { $match: { memberId: new ObjectId(auth.member._id), status: { $ne: "removed" } } },
      { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      { $sort: { joinedAt: -1 } },
    ]).toArray()
    return NextResponse.json({ success: true, data: items.map((item) => ({
      ...item,
      _id: item._id.toString(),
      memberId: undefined,
      projectId: item.projectId?.toString?.() || item.projectId,
      project: item.project ? { ...item.project, _id: item.project._id?.toString?.() || String(item.project._id || "") } : null,
    })) })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load member projects" }, { status: 500 })
  }
}
