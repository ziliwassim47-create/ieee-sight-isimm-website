import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const result = await checkDatabaseConnection()
    return NextResponse.json({ status: "ok", database: "connected", databaseName: result.database, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: "degraded", database: "disconnected", message: "MongoDB is not configured or unavailable" }, { status: 503 })
  }
}
