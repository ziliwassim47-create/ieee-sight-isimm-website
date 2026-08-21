import seed from "@/data/sight-isimm-v2.json"

const mandateId = seed.mandate.seedKey

export const fallbackMandates = [{ ...seed.mandate, _id: mandateId }]
export const fallbackExcom = seed.excom.map((member) => ({ ...member, _id: member.seedKey, mandateId }))
export const fallbackEvents = seed.events.map((event) => ({ ...event, _id: event.seedKey, registrationLink: "", created_at: event.date, updated_at: event.date }))
export const fallbackProjects = seed.projects.map((project) => ({ ...project, _id: project.seedKey, createdAt: project.date, updatedAt: project.date }))
export const fallbackAwards = seed.awards.map((award) => ({ ...award, _id: award.seedKey, createdAt: `${award.year}-01-01`, updatedAt: `${award.year}-01-01` }))
export const fallbackNews = seed.news.map((item) => ({ ...item, _id: item.seedKey, createdAt: item.date, updatedAt: item.date }))

export const fallbackCollections = {
  events: fallbackEvents,
  projects: fallbackProjects,
  news: fallbackNews,
} as const
