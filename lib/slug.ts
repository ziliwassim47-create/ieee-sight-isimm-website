export function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function contentHref(section: "projects" | "events" | "news", item: { _id: string; title: string }) {
  return `/${section}/${toSlug(item.title)}--${item._id}`
}

export function idFromSlug(slug: string) {
  const separator = slug.lastIndexOf("--")
  return separator >= 0 ? slug.slice(separator + 2) : slug
}
