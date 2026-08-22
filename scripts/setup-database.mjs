import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI?.trim()
if (!uri) throw new Error("MONGODB_URI is required")

const client = new MongoClient(uri)

try {
  await client.connect()
  const db = client.db(process.env.MONGODB_DB?.trim() || undefined)
  const indexes = [
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("members").createIndex({ email: 1 }, { unique: true }),
    db.collection("members").createIndex({ ieeeMemberId: 1 }, { unique: true }),
    db.collection("members").createIndex({ status: 1, role: 1 }),
    db.collection("member_credentials").createIndex({ memberId: 1 }, { unique: true }),
    db.collection("event_registrations").createIndex({ eventId: 1, memberId: 1 }, { unique: true }),
    db.collection("event_registrations").createIndex({ ticketCode: 1 }, { unique: true }),
    db.collection("event_registrations").createIndex({ eventId: 1, attendanceStatus: 1 }),
    db.collection("attendance").createIndex({ eventId: 1, memberId: 1 }, { unique: true }),
    db.collection("project_members").createIndex({ projectId: 1, memberId: 1 }, { unique: true }),
    db.collection("volunteer_hours").createIndex({ memberId: 1, status: 1, date: -1 }),
    db.collection("certificates").createIndex({ code: 1 }, { unique: true }),
    db.collection("certificates").createIndex({ memberId: 1, issuedAt: -1 }),
    db.collection("member_badges").createIndex({ memberId: 1, awardedAt: -1 }),
    db.collection("member_achievements").createIndex({ memberId: 1, awardId: 1 }, { unique: true }),
    db.collection("score_entries").createIndex({ memberId: 1, createdAt: -1 }),
    db.collection("score_entries").createIndex(
      { memberId: 1, eventId: 1, activityKey: 1 },
      { unique: true, partialFilterExpression: { eventId: { $exists: true } } }
    ),
    db.collection("member_notifications").createIndex({ memberId: 1, read: 1, createdAt: -1 }),
    db.collection("activity_logs").createIndex({ memberId: 1, createdAt: -1 }),
    db.collection("applications").createIndex({ memberId: 1, type: 1, status: 1 }),
    db.collection("password_reset_requests").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("admin_accounts").createIndex({ email: 1 }, { unique: true }),
  ]
  await Promise.all(indexes)
  console.log(`Database ready: ${db.databaseName}`)
} finally {
  await client.close()
}
