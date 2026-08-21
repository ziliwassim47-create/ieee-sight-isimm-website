import { readFile, writeFile } from "node:fs/promises"
import { MongoClient } from "mongodb"

const sourceBase = (process.env.SIGHT_SOURCE_URL || "https://sight-isimm.ieee.tn").replace(/\/$/, "")
const syncDatabase = process.argv.includes("--database")
const dataUrl = new URL("../data/sight-isimm-v2.json", import.meta.url)

async function fetchCollection(name) {
  const response = await fetch(`${sourceBase}/api/${name}`)
  if (!response.ok) throw new Error(`${name} API returned HTTP ${response.status}`)
  const payload = await response.json()
  if (!payload.success || !Array.isArray(payload.data) || payload.data.length === 0) {
    throw new Error(`${name} API returned no usable records`)
  }
  return payload.data
}

function clean(value) {
  return value?.toString?.().trim?.() ?? ""
}

function mediaUrl(value) {
  const url = clean(value)
  return url.startsWith("/") ? `${sourceBase}${url}` : url
}

function mapEvent(item) {
  return {
    seedKey: `source-event-${item._id}`,
    sourceId: clean(item._id),
    title: clean(item.title),
    description: clean(item.description),
    date: clean(item.date),
    location: clean(item.location) || "Monastir, Tunisia",
    eventType: item.eventType === "upcoming" ? "upcoming" : "previous",
    registrationLink: clean(item.registrationLink),
    vToolsUrl: clean(item.vToolsUrl),
    attendees: Number(item.attendees) || 0,
    images: Array.isArray(item.images) ? item.images.map(mediaUrl).filter(Boolean) : [],
  }
}

function mapProject(item) {
  const projectType = ["Tech for Good", "TSYP", "SDC", "Other"].includes(item.projectType) ? item.projectType : "Other"
  const displayType = clean(item.displayType) || clean(item.customType) || clean(item.projectType) || "Other"
  const imageUrls = Array.isArray(item.imageUrls)
    ? item.imageUrls.map(mediaUrl).filter(Boolean)
    : clean(item.imageUrl)
      ? [mediaUrl(item.imageUrl)]
      : []

  return {
    seedKey: `source-project-${item._id}`,
    sourceId: clean(item._id),
    title: clean(item.title),
    description: clean(item.description),
    date: clean(item.date),
    projectType,
    customType: projectType === "Other" ? displayType : "",
    displayType,
    imageUrls,
    proposalFormUrl: clean(item.proposalFormUrl),
    vToolsUrl: clean(item.vToolsUrl),
    status: ["Completed", "In Progress", "Planned"].includes(item.status) ? item.status : "Completed",
  }
}

async function replaceCollection(db, name, records, timestamps) {
  const collection = db.collection(name)
  const previousRecords = await collection.find({}).toArray()
  await collection.deleteMany({})
  try {
    await collection.insertMany(records.map((record) => ({ ...record, ...timestamps })))
  } catch (error) {
    await collection.deleteMany({})
    if (previousRecords.length) await collection.insertMany(previousRecords)
    throw error
  }
}

const [sourceEvents, sourceProjects] = await Promise.all([
  fetchCollection("events"),
  fetchCollection("projects"),
])

const events = sourceEvents.map(mapEvent)
const projects = sourceProjects.map(mapProject)
if (events.some((item) => !item.title || !item.date) || projects.some((item) => !item.title || !item.date)) {
  throw new Error("The source contains records without a title or date; import cancelled")
}

const seed = JSON.parse(await readFile(dataUrl, "utf8"))
seed.events = events
seed.projects = projects
await writeFile(dataUrl, `${JSON.stringify(seed, null, 2)}\n`, "utf8")

if (syncDatabase) {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required with --database")
  const client = new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect()
    const db = client.db()
    const now = new Date()
    await replaceCollection(db, "events", events, { created_at: now, updated_at: now })
    await replaceCollection(db, "projects", projects, { createdAt: now, updatedAt: now })
  } finally {
    await client.close()
  }
}

console.log(`Imported ${events.length} events and ${projects.length} projects from ${sourceBase}${syncDatabase ? " into JSON and MongoDB" : " into JSON"}.`)
