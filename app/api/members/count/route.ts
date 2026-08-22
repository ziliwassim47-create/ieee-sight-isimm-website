import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export const revalidate = 300

export async function GET() {
  try {
    const db = await getDb()
    const count = await db.collection("members").countDocuments()
    return NextResponse.json({ success: true, data: { count } })
  } catch {
    return NextResponse.json({ success: false, data: { count: 0 } }, { status: 503 })
  }
}
