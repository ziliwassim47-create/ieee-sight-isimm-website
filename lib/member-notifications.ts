import type { Db } from "mongodb"
import { ObjectId } from "mongodb"
import { getMemberLevel } from "@/lib/scoring"

export async function addMemberNotification(
  db: Db,
  memberId: ObjectId,
  notification: { type: string; title: string; message: string; href?: string; eventId?: ObjectId; projectId?: ObjectId; dedupeKey?: string }
) {
  const now = new Date()
  if (notification.dedupeKey) {
    return db.collection("member_notifications").updateOne(
      { memberId, dedupeKey: notification.dedupeKey },
      { $set: { ...notification, read: false, createdAt: now }, $setOnInsert: { memberId } },
      { upsert: true }
    )
  }
  return db.collection("member_notifications").insertOne({ memberId, ...notification, read: false, createdAt: now })
}

export async function notifyActiveMembers(
  db: Db,
  notification: { type: string; title: string; message: string; href?: string; eventId?: ObjectId; dedupeKey: string }
) {
  const members = await db.collection("members").find({ status: "active" }, { projection: { _id: 1 } }).toArray()
  if (!members.length) return
  const now = new Date()
  await db.collection("member_notifications").bulkWrite(members.map((member) => ({
    updateOne: {
      filter: { memberId: member._id, dedupeKey: notification.dedupeKey },
      update: { $set: { ...notification, read: false, createdAt: now }, $setOnInsert: { memberId: member._id } },
      upsert: true,
    },
  })), { ordered: false })
}

export async function getMemberScore(db: Db, memberId: ObjectId) {
  const result = await db.collection("score_entries").aggregate<{ total: number }>([
    { $match: { memberId } },
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]).toArray()
  return result[0]?.total || 0
}

export async function notifyMemberLevelChange(db: Db, memberId: ObjectId, previousScore: number) {
  const score = await getMemberScore(db, memberId)
  const previousLevel = getMemberLevel(previousScore)
  const memberLevel = getMemberLevel(score)
  if (previousLevel !== memberLevel) {
    await addMemberNotification(db, memberId, {
      type: "member_level_changed",
      title: "Member level updated",
      message: `Your SIGHT level changed from ${previousLevel} to ${memberLevel}. Your final score is ${score} points.`,
      href: "/dashboard",
    })
  }
  return { score, memberLevel }
}
