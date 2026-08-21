import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE, clearAdminCookie, verifyAdminToken } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const authenticated = verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)
  return NextResponse.json({ success: true, authenticated }, { status: authenticated ? 200 : 401 })
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearAdminCookie(response)
  return response
}
