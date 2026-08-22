import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

type Context = { params: Promise<{ code: string }> }

export async function GET(_request: Request, context: Context) {
  try {
    const { code } = await context.params
    const db = await getDb()
    const certificate = await db.collection("certificates").aggregate([
      { $match: { code: code.toUpperCase(), status: "issued" } },
      { $lookup: { from: "members", localField: "memberId", foreignField: "_id", as: "member" } },
      { $unwind: "$member" },
      { $project: { code: 1, title: 1, type: 1, issuedAt: 1, "member.firstName": 1, "member.lastName": 1 } },
    ]).next()
    if (!certificate) return NextResponse.json({ success: false, valid: false, message: "Certificate not found" }, { status: 404 })
    return NextResponse.json({ success: true, valid: true, issuer: "IEEE SIGHT ISIMM Student Branch Group", data: { ...certificate, _id: certificate._id.toString() } })
  } catch {
    return NextResponse.json({ success: false, valid: false, message: "Certificate verification unavailable" }, { status: 503 })
  }
}
