import { randomInt, randomBytes, scrypt as scryptCallback } from "node:crypto"
import { readFile, mkdir } from "node:fs/promises"
import { basename, resolve } from "node:path"
import { promisify } from "node:util"
import ExcelJS from "exceljs"
import { MongoClient } from "mongodb"

const sourcePath = process.argv[2]
const outputPath = resolve(process.argv[3] || "private-exports/sight-isimm-member-passwords.xlsx")
if (!sourcePath) {
  console.error("Usage: node --env-file=.env.local scripts/import-ieee-members.mjs <members.tsv> [output.xlsx]")
  process.exit(1)
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing")
  process.exit(1)
}

const passwordGroups = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!@#$%&*",
]
const allPasswordCharacters = passwordGroups.join("")
const randomCharacter = (characters) => characters[randomInt(characters.length)]
const createPassword = () => {
  const characters = passwordGroups.map(randomCharacter)
  while (characters.length < 14) characters.push(randomCharacter(allPasswordCharacters))
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]]
  }
  return characters.join("")
}

const text = await readFile(sourcePath, "utf8")
const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim())
const headers = lines.shift()?.split("\t").map((value) => value.trim()) || []
const expectedHeaders = ["Member/Customer Number", "Last Name", "First Name", "Middle Name", "Email Address", "Grade", "IEEE Status"]
if (expectedHeaders.some((header, index) => headers[index] !== header)) {
  throw new Error(`Unexpected columns in ${basename(sourcePath)}`)
}

const members = lines.map((line, rowIndex) => {
  const values = line.split("\t")
  const [ieeeMemberId, lastName, firstName, middleName, email, ieeeGrade, ieeeStatus] = values.map((value) => value?.trim() || "")
  if (!ieeeMemberId || !lastName || !firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Invalid member data on source row ${rowIndex + 2}`)
  }
  return {
    ieeeMemberId,
    lastName,
    firstName,
    middleName,
    email: email.toLowerCase(),
    ieeeGrade,
    ieeeStatus,
    password: createPassword(),
  }
})

const duplicateEmails = members.filter((member, index) => members.findIndex((candidate) => candidate.email === member.email) !== index)
const duplicateIds = members.filter((member, index) => members.findIndex((candidate) => candidate.ieeeMemberId === member.ieeeMemberId) !== index)
if (duplicateEmails.length || duplicateIds.length) throw new Error("The source contains duplicate emails or IEEE Member IDs")

const scrypt = promisify(scryptCallback)
const client = new MongoClient(process.env.MONGODB_URI)
let inserted = 0
let updated = 0

try {
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || undefined)
  const collection = db.collection("members")
  const now = new Date()

  for (const member of members) {
    const salt = randomBytes(16).toString("hex")
    const derivedKey = await scrypt(member.password, salt, 64)
    const passwordHash = `scrypt$${salt}$${derivedKey.toString("hex")}`
    const existing = await collection.findOne({ $or: [{ email: member.email }, { ieeeMemberId: member.ieeeMemberId }] }, { projection: { _id: 1 } })
    const result = await collection.updateOne(
      existing ? { _id: existing._id } : { email: member.email },
      {
        $set: {
          firstName: member.firstName,
          middleName: member.middleName,
          lastName: member.lastName,
          email: member.email,
          passwordHash,
          passwordChangedAt: now,
          ieeeMemberId: member.ieeeMemberId,
          ieeeGrade: member.ieeeGrade,
          ieeeStatus: member.ieeeStatus,
          university: "ISIMM",
          department: "Not specified",
          studyLevel: member.ieeeGrade,
          status: member.ieeeStatus.toLowerCase() === "active" ? "active" : "suspended",
          role: "member",
          officerPosition: "",
          approvedAt: member.ieeeStatus.toLowerCase() === "active" ? now : null,
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
    if (result.upsertedCount) inserted += 1
    else updated += 1
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "IEEE SIGHT ISIMM Admin"
  workbook.created = new Date()
  const worksheet = workbook.addWorksheet("Member Credentials", { views: [{ state: "frozen", ySplit: 1 }] })
  worksheet.columns = [
    { header: "IEEE Member ID", key: "ieeeMemberId", width: 20 },
    { header: "Last Name", key: "lastName", width: 24 },
    { header: "First Name", key: "firstName", width: 24 },
    { header: "Middle Name", key: "middleName", width: 20 },
    { header: "Email", key: "email", width: 38 },
    { header: "Temporary Password", key: "password", width: 24 },
    { header: "IEEE Grade", key: "ieeeGrade", width: 28 },
    { header: "IEEE Status", key: "ieeeStatus", width: 16 },
  ]
  worksheet.addRows(members)
  worksheet.autoFilter = { from: "A1", to: "H1" }
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
  worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } }
  worksheet.getColumn("ieeeMemberId").numFmt = "@"
  worksheet.getColumn("password").numFmt = "@"
  worksheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "middle" }
    if (rowNumber > 1 && rowNumber % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } }
  })

  await mkdir(resolve(outputPath, ".."), { recursive: true })
  await workbook.xlsx.writeFile(outputPath)
  console.log(JSON.stringify({ total: members.length, inserted, updated, outputPath }))
} finally {
  await client.close()
}
