import { createHmac, timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { serializeMember } from "@/lib/member-types"

export const MEMBER_COOKIE = "sight-member-session"
const SESSION_SECONDS = 60 * 60 * 24 * 7

function authSecret() {
  return process.env.AUTH_SECRET || ""
}

function sign(value: string) {
  return createHmac("sha256", authSecret()).update(value).digest("base64url")
}

export function createMemberToken(memberId: string, role: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS
  const payload = `${memberId}.${role}.${expires}`
  return `${payload}.${sign(payload)}`
}

export function verifyMemberToken(token?: string) {
  if (!token || !authSecret()) return null
  const [memberId, role, expiresText, signature] = token.split(".")
  if (!ObjectId.isValid(memberId) || !role || !expiresText || !signature || Number(expiresText) <= Math.floor(Date.now() / 1000)) return null

  const expected = Buffer.from(sign(`${memberId}.${role}.${expiresText}`))
  const provided = Buffer.from(signature)
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null
  return { memberId, role, expires: Number(expiresText) }
}

export function setMemberCookie(response: NextResponse, memberId: string, role: string) {
  response.cookies.set(MEMBER_COOKIE, createMemberToken(memberId, role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  })
}

export function clearMemberCookie(response: NextResponse) {
  response.cookies.set(MEMBER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export async function getAuthenticatedMember(request: NextRequest) {
  const session = verifyMemberToken(request.cookies.get(MEMBER_COOKIE)?.value)
  if (!session) return null

  const db = await getDb()
  const member = await db.collection("members").findOne({ _id: new ObjectId(session.memberId), status: "active" })
  return member ? serializeMember(member) : null
}

export async function memberUnauthorizedUnlessActive(request: NextRequest) {
  try {
    const member = await getAuthenticatedMember(request)
    if (member) return { member, response: null }
  } catch {
    return {
      member: null,
      response: NextResponse.json({ success: false, message: "Member database is unavailable" }, { status: 503 }),
    }
  }

  return {
    member: null,
    response: NextResponse.json({ success: false, message: "Active member authentication required" }, { status: 401 }),
  }
}
