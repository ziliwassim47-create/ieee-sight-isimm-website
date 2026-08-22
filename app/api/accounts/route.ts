import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { unauthorizedUnlessAdmin } from "@/lib/admin-auth"
import { hashPassword } from "@/lib/password"
import { storeMemberCredential } from "@/lib/credential-vault"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(request: NextRequest) {
  const unauthorized = unauthorizedUnlessAdmin(request)
  if (unauthorized) return unauthorized

  try {
    const db = await getDb()
    const accounts = await db
      .collection("admin_accounts")
      .find({}, { projection: { passwordHash: 0, role: 0, previousMemberRole: 0 } })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: accounts.map((account) => ({ ...account, _id: account._id.toString() })),
      bootstrapAccount: process.env.ADMIN_EMAIL || null,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to load ExCom accounts", error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = unauthorizedUnlessAdmin(request)
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const name = String(body.name || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")

    if (!name || !emailPattern.test(email) || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Name, a valid email, and a password of at least 8 characters are required" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const collection = db.collection("admin_accounts")
    await collection.createIndex({ email: 1 }, { unique: true })
    const now = new Date()
    const account = {
      name,
      email,
      passwordHash: await hashPassword(password),
      accountType: "excom",
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    const result = await collection.insertOne(account)
    const names = name.split(/\s+/).filter(Boolean)
    const existingMember = await db.collection("members").findOne({ email })
    const memberResult = await db.collection("members").findOneAndUpdate(
      { email },
      {
        $set: {
          passwordHash: account.passwordHash,
          status: "active",
          role: "admin",
          officerPosition: "ExCom",
          approvedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          firstName: names[0] || name,
          lastName: names.slice(1).join(" ") || "ExCom",
          ieeeMemberId: `EXCOM-${result.insertedId}`,
          university: "ISIMM",
          department: "ExCom",
          studyLevel: "ExCom",
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
      { upsert: true, returnDocument: "after" }
    )
    await collection.updateOne(
      { _id: result.insertedId },
      { $set: { memberId: memberResult?._id, previousMemberRole: String(existingMember?.role || "member") } }
    )
    if (memberResult?._id) await storeMemberCredential(db, memberResult._id, password, "bootstrap-admin")

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId.toString(), name, email, active: account.active, createdAt: now, updatedAt: now },
    })
  } catch (error: unknown) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000
    return NextResponse.json(
      { success: false, message: duplicate ? "An account with this email already exists" : "Failed to create ExCom account" },
      { status: duplicate ? 409 : 500 }
    )
  }
}
