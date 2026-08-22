import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import type { Db } from "mongodb"
import { ObjectId } from "mongodb"

type StoredCredential = {
  memberId: ObjectId
  encryptedPassword: string
  iv: string
  authTag: string
  changedAt: Date
  updatedAt: Date
  updatedBy: ObjectId | string
  createdAt?: Date
}

function vaultKey() {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || ""
  if (!secret) throw new Error("AUTH_SECRET is required for the member credential vault")
  return createHash("sha256").update(`sight-member-credential-vault:${secret}`).digest()
}

export function encryptMemberPassword(password: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", vaultKey(), iv)
  const encryptedPassword = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]).toString("base64")
  return { encryptedPassword, iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") }
}

export function decryptMemberPassword(value: Pick<StoredCredential, "encryptedPassword" | "iv" | "authTag">) {
  const decipher = createDecipheriv("aes-256-gcm", vaultKey(), Buffer.from(value.iv, "base64"))
  decipher.setAuthTag(Buffer.from(value.authTag, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(value.encryptedPassword, "base64")), decipher.final()]).toString("utf8")
}

export async function storeMemberCredential(db: Db, memberId: ObjectId, password: string, updatedBy: ObjectId | string) {
  const now = new Date()
  const encrypted = encryptMemberPassword(password)
  await db.collection<StoredCredential>("member_credentials").updateOne(
    { memberId },
    {
      $set: { ...encrypted, changedAt: now, updatedAt: now, updatedBy },
      $setOnInsert: { memberId, createdAt: now },
    },
    { upsert: true }
  )
}

export async function revealMemberCredential(db: Db, memberId: ObjectId) {
  const credential = await db.collection<StoredCredential>("member_credentials").findOne({ memberId })
  if (!credential) return null
  return { password: decryptMemberPassword(credential), changedAt: credential.changedAt }
}
