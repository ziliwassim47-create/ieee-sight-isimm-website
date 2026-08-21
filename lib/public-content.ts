import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { idFromSlug, toSlug } from "@/lib/slug"
import { fallbackCollections } from "@/lib/fallback-data"

export type PublicContent = Record<string, unknown> & { _id: string; title: string }

export async function getPublicContent(collection: "projects" | "events" | "news", slug: string): Promise<PublicContent | null> {
  try {
    const db = await getDb()
    const id = idFromSlug(slug)
    let item = ObjectId.isValid(id) ? await db.collection(collection).findOne({ _id: new ObjectId(id) }) : null
    if (!item) {
      const items = await db.collection(collection).find({}, { projection: { title: 1, description: 1, summary: 1, date: 1, dateIsProvisional: 1, location: 1, attendees: 1, images: 1, imageUrls: 1, imageUrl: 1, eventType: 1, registrationLink: 1, vToolsUrl: 1, status: 1, projectType: 1, displayType: 1, proposalFormUrl: 1, category: 1, link: 1, linkLabel: 1, deadlineDate: 1, sdgs: 1, technologies: 1 } }).limit(250).toArray()
      item = items.find((candidate) => toSlug(String(candidate.title || "")) === slug) || null
    }
    if (item) return JSON.parse(JSON.stringify({ ...item, _id: item._id.toString() }))
  } catch {}

  const fallback = fallbackCollections[collection].find((item) => item._id === idFromSlug(slug) || toSlug(item.title) === slug)
  return fallback ? JSON.parse(JSON.stringify(fallback)) as PublicContent : null
}
