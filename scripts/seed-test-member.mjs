import { randomBytes, scrypt as scryptCallback } from "node:crypto"
import { promisify } from "node:util"
import { MongoClient } from "mongodb"

const password = process.argv[2]
if (!password || password.length < 8) {
  console.error("Usage: node --env-file=.env.local scripts/seed-test-member.mjs <password-of-at-least-8-characters>")
  process.exit(1)
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing")
  process.exit(1)
}

const scrypt = promisify(scryptCallback)
const salt = randomBytes(16).toString("hex")
const derivedKey = await scrypt(password, salt, 64)
const passwordHash = `scrypt$${salt}$${derivedKey.toString("hex")}`
const client = new MongoClient(process.env.MONGODB_URI)

try {
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || undefined)
  const now = new Date()
  const result = await db.collection("members").updateOne(
    { email: "ziliwassim47@gmail.com" },
    {
      $set: {
        firstName: "Wassim",
        lastName: "Zili",
        email: "ziliwassim47@gmail.com",
        passwordHash,
        ieeeMemberId: "123456789",
        university: "ISIMM",
        department: "Computer Science",
        studyLevel: "Licence 3",
        status: "active",
        role: "member",
        officerPosition: "",
        approvedAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        photoUrl: "",
        skills: [],
        interests: [],
        technologies: [],
        sdgs: [],
        linkedin: "",
        github: "",
        portfolio: "",
        createdAt: now,
      },
    },
    { upsert: true }
  )
  const member = await db.collection("members").findOne(
    { email: "ziliwassim47@gmail.com" },
    { projection: { passwordHash: 0 } }
  )
  console.log(JSON.stringify({
    created: result.upsertedCount === 1,
    updated: result.modifiedCount === 1,
    member: {
      id: member?._id.toString(),
      name: `${member?.firstName} ${member?.lastName}`,
      email: member?.email,
      ieeeMemberId: member?.ieeeMemberId,
      status: member?.status,
    },
  }))
} finally {
  await client.close()
}
