import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI?.trim()
if (!uri) throw new Error("MONGODB_URI is required")

const client = new MongoClient(uri)
try {
  await client.connect()
  const db = client.db(process.env.MONGODB_DB?.trim() || undefined)
  const now = new Date()
  const registrations = await db.collection("event_registrations").find({ attendanceStatus: "present", status: { $ne: "cancelled" } }).toArray()
  const eventIds = [...new Set(registrations.map((registration) => String(registration.eventId)))].map((id) => registrations.find((registration) => String(registration.eventId) === id)?.eventId).filter(Boolean)
  const events = eventIds.length ? await db.collection("events").find({ _id: { $in: eventIds } }, { projection: { title: 1 } }).toArray() : []
  const eventTitles = new Map(events.map((event) => [String(event._id), String(event.title || "SIGHT Event")]))

  let attendanceEntries = 0
  for (const registration of registrations) {
    const result = await db.collection("score_entries").updateOne(
      { memberId: registration.memberId, eventId: registration.eventId, activityKey: "event_attendance" },
      {
        $set: { activityLabel: "Attendance at an Event", points: 3, comment: "Attendance imported from the existing attendance record", contextTitle: eventTitles.get(String(registration.eventId)) || "SIGHT Event", reviewAudience: "HR / ExCom", updatedAt: now },
        $setOnInsert: { createdAt: registration.attendedAt || registration.updatedAt || registration.registeredAt || now, createdBy: "scoring-migration" },
      },
      { upsert: true }
    )
    if (result.upsertedCount) attendanceEntries += 1
  }

  const overrides = await db.collection("members").updateMany({ sightPointsOverride: { $exists: true } }, { $unset: { sightPointsOverride: "" } })
  await db.collection("score_entries").updateMany({}, { $set: { points: 3 } })
  console.log(JSON.stringify({ database: db.databaseName, attendanceEntriesCreated: attendanceEntries, manualOverridesRemoved: overrides.modifiedCount }))
} finally {
  await client.close()
}
