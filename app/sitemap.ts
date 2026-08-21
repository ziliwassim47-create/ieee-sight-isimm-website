import type { MetadataRoute } from "next"
import { getDb } from "@/lib/mongodb"
import { toSlug } from "@/lib/slug"
import { fallbackCollections } from "@/lib/fallback-data"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sight-isimm.ieee.tn"
  const routes = ["", "/about", "/projects", "/events", "/impact", "/news", "/team", "/awards", "/sdgs", "/partners", "/join", "/contact", "/privacy"]
  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/projects" || route === "/impact" ? 0.9 : 0.7,
  }))
  const fallbackEntries: MetadataRoute.Sitemap = (["projects", "events", "news"] as const).flatMap((collection) => fallbackCollections[collection].map((item) => ({
    url: `${base}/${collection}/${toSlug(item.title)}--${item._id}`,
    lastModified: new Date(String(item.date)),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  })))

  try {
    const db = await getDb()
    const collections = ["projects", "events", "news"] as const
    const documents = await Promise.all(collections.map((collection) => db.collection(collection).find({}, { projection: { title: 1, updatedAt: 1, updated_at: 1 } }).toArray()))
    const dynamicEntries: MetadataRoute.Sitemap = documents.flatMap((items, index) => items.map((item) => ({
      url: `${base}/${collections[index]}/${toSlug(String(item.title || "item"))}--${item._id.toString()}`,
      lastModified: item.updatedAt || item.updated_at || new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })))
    return dynamicEntries.length ? [...staticEntries, ...dynamicEntries] : [...staticEntries, ...fallbackEntries]
  } catch {
    return [...staticEntries, ...fallbackEntries]
  }
}
