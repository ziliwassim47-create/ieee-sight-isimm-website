import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"

export async function GET(request: NextRequest) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  try {
    const db = await getDb()
    const memberId = new ObjectId(auth.member._id)
    const [badges, achievements] = await Promise.all([
      db.collection("member_badges").find({ memberId }).sort({ awardedAt: -1 }).toArray(),
      db.collection("member_achievements").aggregate([
        { $match: { memberId } },
        { $lookup: { from: "awards", localField: "awardId", foreignField: "_id", as: "award" } },
        { $unwind: { path: "$award", preserveNullAndEmptyArrays: true } },
        { $sort: { awardedAt: -1 } },
        { $project: { title: 1, contribution: 1, awardedAt: 1, "award.title": 1, "award.year": 1, "award.description": 1, "award.imageUrls": 1, "award.imageUrl": 1 } },
      ]).toArray(),
    ])
    const serialize = (item: Record<string, unknown>) => ({ ...item, _id: item._id?.toString?.() ?? String(item._id || "") })
    return NextResponse.json({ success: true, data: { badges: badges.map(serialize), achievements: achievements.map(serialize) } })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load achievements" }, { status: 500 })
  }
}
