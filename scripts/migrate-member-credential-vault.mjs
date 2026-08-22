import { createCipheriv, createHash, randomBytes } from "node:crypto"
import { resolve } from "node:path"
import ExcelJS from "exceljs"
import { MongoClient } from "mongodb"

const inputPath = resolve(process.argv[2] || "private-exports/sight-isimm-member-passwords-2026-08-21.xlsx")
const uri = process.env.MONGODB_URI?.trim()
const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || ""
if (!uri) throw new Error("MONGODB_URI is required")
if (!secret) throw new Error("AUTH_SECRET is required")

const key = createHash("sha256").update(`sight-member-credential-vault:${secret}`).digest()
const encrypt = (password) => {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encryptedPassword = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]).toString("base64")
  return { encryptedPassword, iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") }
}

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(inputPath)
const worksheet = workbook.getWorksheet("Member Credentials") || workbook.worksheets[0]
if (!worksheet) throw new Error("Member Credentials worksheet was not found")

const rows = []
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return
  const ieeeMemberId = String(row.getCell(1).text || "").trim()
  const email = String(row.getCell(5).text || "").trim().toLowerCase()
  const password = String(row.getCell(6).text || "")
  if (ieeeMemberId && email && password) rows.push({ ieeeMemberId, email, password })
})

const client = new MongoClient(uri)
let migrated = 0
let missing = 0
try {
  await client.connect()
  const db = client.db(process.env.MONGODB_DB?.trim() || undefined)
  const now = new Date()
  for (const row of rows) {
    const member = await db.collection("members").findOne({ $or: [{ ieeeMemberId: row.ieeeMemberId }, { email: row.email }] }, { projection: { _id: 1 } })
    if (!member) {
      missing += 1
      continue
    }
    await db.collection("member_credentials").updateOne(
      { memberId: member._id },
      { $set: { ...encrypt(row.password), changedAt: now, updatedAt: now, updatedBy: "credential-migration" }, $setOnInsert: { memberId: member._id, createdAt: now } },
      { upsert: true }
    )
    migrated += 1
  }
  console.log(JSON.stringify({ sourceRows: rows.length, migrated, missing }))
} finally {
  await client.close()
}
