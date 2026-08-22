import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { clearMemberCookie, getAuthenticatedMember } from "@/lib/member-auth"
import { getDb } from "@/lib/mongodb"
import { getMemberLevel } from "@/lib/scoring"

export async function GET(request: NextRequest) {
  try {
    const member = await getAuthenticatedMember(request)
    if (!member) return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    const db = await getDb()
    const scoreResult = await db.collection("score_entries").aggregate<{ total: number }>([
      { $match: { memberId: new ObjectId(member._id) } },
      { $group: { _id: null, total: { $sum: "$points" } } },
    ]).toArray()
    const sightPoints = scoreResult[0]?.total || 0
    return NextResponse.json({
      success: true,
      authenticated: true,
      member,
      sightPoints,
      memberLevel: getMemberLevel(sightPoints),
    })
  } catch {
    return NextResponse.json({ success: false, authenticated: false, message: "Member database is unavailable" }, { status: 503 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearMemberCookie(response)
  return response
}
