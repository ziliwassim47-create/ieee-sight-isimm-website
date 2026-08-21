import { createHmac, timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export const ADMIN_COOKIE = "sight-admin-session"
const SESSION_SECONDS = 60 * 60 * 8

function secret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || ""
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url")
}

export function createAdminToken() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS
  const payload = `admin.${expires}`
  return `${payload}.${sign(payload)}`
}

export function verifyAdminToken(token?: string) {
  if (!token || !secret()) return false
  const [role, expiresText, signature] = token.split(".")
  if (role !== "admin" || !expiresText || !signature || Number(expiresText) <= Math.floor(Date.now() / 1000)) return false
  const expected = Buffer.from(sign(`${role}.${expiresText}`))
  const provided = Buffer.from(signature)
  return expected.length === provided.length && timingSafeEqual(expected, provided)
}

export function unauthorizedUnlessAdmin(request: NextRequest) {
  if (verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) return null
  return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
}

export function setAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  })
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 })
}
