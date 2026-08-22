import { createDecipheriv, createHash, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { resolve } from "node:path"
import { promisify } from "node:util"
import ExcelJS from "exceljs"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI?.trim()
const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || ""
const workbookPath = process.argv[2] ? resolve(process.argv[2]) : null
if (!uri) throw new Error("MONGODB_URI is required")
if (!secret) throw new Error("AUTH_SECRET is required")

const key = createHash("sha256").update(`sight-member-credential-vault:${secret}`).digest()
const decrypt = (credential) => {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(credential.iv, "base64"))
  decipher.setAuthTag(Buffer.from(credential.authTag, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(credential.encryptedPassword, "base64")),
    decipher.final(),
  ]).toString("utf8")
}

const scrypt = promisify(scryptCallback)
const verifyHash = async (password, storedHash) => {
  const [algorithm, salt, encodedKey] = String(storedHash || "").split("$")
  if (algorithm !== "scrypt" || !salt || !encodedKey) return false
  const storedKey = Buffer.from(encodedKey, "hex")
  const derivedKey = await scrypt(password, salt, storedKey.length)
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
}

const excelPasswords = new Map()
let excelRows = null
if (workbookPath) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(workbookPath)
  const worksheet = workbook.getWorksheet("Member Credentials") || workbook.worksheets[0]
  if (!worksheet) throw new Error("Member Credentials worksheet was not found")
  excelRows = 0
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const memberId = String(row.getCell(1).text || "").trim()
    const email = String(row.getCell(5).text || "").trim().toLowerCase()
    const password = String(row.getCell(6).text || "")
    if (memberId && email && password) {
      excelPasswords.set(`id:${memberId}`, password)
      excelPasswords.set(`email:${email}`, password)
      excelRows += 1
    }
  })
}

const client = new MongoClient(uri)
try {
  await client.connect()
  const db = client.db(process.env.MONGODB_DB?.trim() || undefined)
  const [members, credentials] = await Promise.all([
    db.collection("members").find({}, { projection: { email: 1, ieeeMemberId: 1, passwordHash: 1 } }).toArray(),
    db.collection("member_credentials").find({}).toArray(),
  ])
  const credentialsByMember = new Map(credentials.map((credential) => [String(credential.memberId), credential]))
  let missingVault = 0
  let invalidHashes = 0
  let missingExcelRows = 0
  let mismatchedExcelPasswords = 0

  for (const member of members) {
    const credential = credentialsByMember.get(String(member._id))
    if (!credential) {
      missingVault += 1
      continue
    }
    const password = decrypt(credential)
    if (!await verifyHash(password, member.passwordHash)) invalidHashes += 1
    if (workbookPath) {
      const excelPassword = excelPasswords.get(`id:${String(member.ieeeMemberId || "")}`)
        || excelPasswords.get(`email:${String(member.email || "").toLowerCase()}`)
      if (!excelPassword) missingExcelRows += 1
      else if (excelPassword !== password) mismatchedExcelPasswords += 1
    }
  }

  console.log(JSON.stringify({
    members: members.length,
    vaultCredentials: credentials.length,
    missingVault,
    invalidHashes,
    excelRows,
    missingExcelRows,
    mismatchedExcelPasswords,
  }))
} finally {
  await client.close()
}
