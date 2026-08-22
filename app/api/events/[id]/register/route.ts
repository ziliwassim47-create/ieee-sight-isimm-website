import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { memberUnauthorizedUnlessActive } from "@/lib/member-auth"

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "This event must be imported into MongoDB before registration" }, { status: 400 })

  try {
    const db = await getDb()
    const registration = await db.collection("event_registrations").findOne({ eventId: new ObjectId(id), memberId: new ObjectId(auth.member._id) })
    return NextResponse.json({ success: true, registered: Boolean(registration && registration.status !== "cancelled"), data: registration ? { ...registration, _id: registration._id.toString() } : null })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to load event registration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: Context) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "This event must be imported into MongoDB before registration" }, { status: 400 })

  try {
    const db = await getDb()
    const eventId = new ObjectId(id)
    const memberId = new ObjectId(auth.member._id)
    const event = await db.collection("events").findOne({ _id: eventId })
    if (!event) return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    if (event.eventType !== "upcoming") return NextResponse.json({ success: false, message: "Registration is closed for this event" }, { status: 409 })

    const existing = await db.collection("event_registrations").findOne({ eventId, memberId })
    if (existing && existing.status !== "cancelled") {
      return NextResponse.json({ success: true, message: "Registration already confirmed", data: { ...existing, _id: existing._id.toString() } })
    }

    const ticketCode = `SIGHT-${new Date().getFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`
    const now = new Date()
    const registration = { eventId, memberId, status: "confirmed", attendanceStatus: "not_checked", ticketCode, qrData: `SIGHT-ATTENDANCE:${ticketCode}`, registeredAt: now, updatedAt: now }
    const result = existing
      ? await db.collection("event_registrations").findOneAndUpdate({ _id: existing._id }, { $set: registration }, { returnDocument: "after" })
      : { ...registration, _id: (await db.collection("event_registrations").insertOne(registration)).insertedId }
    await db.collection("activity_logs").insertOne({ memberId, type: "event_registration", eventId, title: String(event.title), createdAt: now })
    return NextResponse.json({ success: true, message: "Registration confirmed", data: { ...result, _id: result?._id.toString() } }, { status: existing ? 200 : 201 })
  } catch (error: unknown) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000
    return NextResponse.json({ success: false, message: duplicate ? "Registration already confirmed" : "Failed to register for event" }, { status: duplicate ? 409 : 500 })
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await memberUnauthorizedUnlessActive(request)
  if (auth.response || !auth.member) return auth.response
  const { id } = await context.params
  if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })

  try {
    const db = await getDb()
    const result = await db.collection("event_registrations").findOneAndUpdate(
      { eventId: new ObjectId(id), memberId: new ObjectId(auth.member._id), attendanceStatus: { $ne: "present" } },
      { $set: { status: "cancelled", updatedAt: new Date() } },
      { returnDocument: "after" }
    )
    if (!result) return NextResponse.json({ success: false, message: "Registration not found or attendance already confirmed" }, { status: 404 })
    return NextResponse.json({ success: true, message: "Registration cancelled" })
  } catch {
    return NextResponse.json({ success: false, message: "Failed to cancel registration" }, { status: 500 })
  }
}
