import { readFile } from "node:fs/promises"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error("MONGODB_URI is missing. Copy .env.example to .env.local and configure the database first.")
  process.exit(1)
}

const seed = JSON.parse(await readFile(new URL("../data/sight-isimm-v2.json", import.meta.url), "utf8"))
const client = new MongoClient(uri)
const now = new Date()

function upsertBySeedOrTitle(collection, items, titleField = "title") {
  return collection.bulkWrite(items.map((item) => ({
    updateOne: {
      filter: { $or: [{ seedKey: item.seedKey }, { [titleField]: item[titleField] }] },
      update: { $set: { ...item, updatedAt: now }, $setOnInsert: { createdAt: now } },
      upsert: true,
    },
  })))
}

async function replaceCollection(collection, items, timestamps) {
  if (!Array.isArray(items) || items.length === 0) throw new Error(`${collection.collectionName} seed is empty; replacement cancelled`)
  const previousItems = await collection.find({}).toArray()
  await collection.deleteMany({})
  try {
    await collection.insertMany(items.map((item) => ({ ...item, ...timestamps })))
  } catch (error) {
    await collection.deleteMany({})
    if (previousItems.length) await collection.insertMany(previousItems)
    throw error
  }
}

try {
  await client.connect()
  const db = client.db()
  const mandates = db.collection("mandates")

  await mandates.updateMany({ seedKey: { $ne: seed.mandate.seedKey } }, { $set: { isCurrent: false } })
  const mandate = await mandates.findOneAndUpdate(
    { $or: [{ seedKey: seed.mandate.seedKey }, { name: seed.mandate.name }] },
    { $set: { ...seed.mandate, updated_at: now }, $setOnInsert: { created_at: now } },
    { upsert: true, returnDocument: "after" },
  )

  const mandateId = mandate._id.toString()
  const excomItems = seed.excom.map((member) => ({ ...member, mandateId }))
  await db.collection("excom").bulkWrite(excomItems.map((member) => ({
    updateOne: {
      filter: { mandateId, $or: [{ seedKey: member.seedKey }, { name: member.name }] },
      update: { $set: { ...member, updatedAt: now }, $setOnInsert: { createdAt: now } },
      upsert: true,
    },
  })))

  await Promise.all([
    replaceCollection(db.collection("events"), seed.events, { created_at: now, updated_at: now }),
    replaceCollection(db.collection("projects"), seed.projects, { createdAt: now, updatedAt: now }),
    upsertBySeedOrTitle(db.collection("awards"), seed.awards),
    upsertBySeedOrTitle(db.collection("news"), seed.news),
  ])

  await Promise.all([
    mandates.createIndex({ seedKey: 1 }, { unique: true, sparse: true }),
    db.collection("excom").createIndex({ seedKey: 1 }, { unique: true, sparse: true }),
    db.collection("events").createIndex({ seedKey: 1 }, { unique: true, sparse: true }),
    db.collection("projects").createIndex({ seedKey: 1 }, { unique: true, sparse: true }),
    db.collection("awards").createIndex({ seedKey: 1 }, { unique: true, sparse: true }),
    db.collection("news").createIndex({ seedKey: 1 }, { unique: true, sparse: true }),
  ])

  console.log(`Seed complete: 1 mandate, ${seed.excom.length} ExCom members, ${seed.events.length} events, ${seed.projects.length} projects, ${seed.awards.length} awards, ${seed.news.length} news items.`)
} catch (error) {
  console.error("Seed failed:", error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await client.close()
}
