import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-auth"
import { getAuthenticatedMember } from "@/lib/member-auth"
import type { PublicMember } from "@/lib/member-types"

export type PlatformPermission = "members.manage" | "events.manage" | "attendance.manage" | "projects.manage" | "certificates.manage" | "statistics.view"

const rolePermissions: Record<string, PlatformPermission[]> = {
  admin: ["members.manage", "events.manage", "attendance.manage", "projects.manage", "certificates.manage", "statistics.view"],
  officer: [],
  project_leader: [],
  project_member: [],
  member: [],
}

const positionPermissions: Record<string, PlatformPermission[]> = {
  Chair: ["members.manage", "events.manage", "attendance.manage", "projects.manage", "certificates.manage", "statistics.view"],
  "Vice Chair": ["members.manage", "events.manage", "attendance.manage", "projects.manage", "certificates.manage", "statistics.view"],
  HR: ["members.manage", "attendance.manage", "certificates.manage", "statistics.view"],
  Secretary: ["events.manage", "attendance.manage", "certificates.manage", "statistics.view"],
  "Project Coordinator": ["projects.manage", "statistics.view"],
  Webmaster: ["statistics.view"],
}

export async function authorizePlatform(request: NextRequest, permission: PlatformPermission): Promise<
  | { authorized: true; member: PublicMember | null }
  | { authorized: false; response: NextResponse }
> {
  if (verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) return { authorized: true, member: null }

  try {
    const member = await getAuthenticatedMember(request)
    if (!member) return { authorized: false, response: NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 }) }
    const permissions = new Set([...(rolePermissions[member.role] || []), ...(positionPermissions[member.officerPosition || ""] || [])])
    if (permissions.has(permission)) return { authorized: true, member }
    return { authorized: false, response: NextResponse.json({ success: false, message: "Insufficient permission" }, { status: 403 }) }
  } catch {
    return { authorized: false, response: NextResponse.json({ success: false, message: "Authorization service unavailable" }, { status: 503 }) }
  }
}
