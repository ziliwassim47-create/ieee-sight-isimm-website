import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { fallbackAwards, fallbackEvents, fallbackProjects } from "@/lib/fallback-data"

type ChatLink = { label: string; href: string }

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function listTitles(items: Array<Record<string, unknown>>, limit = 4) {
  return items.slice(0, limit).map((item) => String(item.title || "")).filter(Boolean)
}

function response(answer: string, links: ChatLink[] = []) {
  return NextResponse.json({ success: true, answer, links })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = String(body.message || "").trim()
    if (!message) return NextResponse.json({ success: false, message: "Please enter a question." }, { status: 400 })
    if (message.length > 500) return NextResponse.json({ success: false, message: "Please keep your question under 500 characters." }, { status: 400 })

    const prompt = normalize(message)
    let events: Array<Record<string, unknown>> = fallbackEvents
    let projects: Array<Record<string, unknown>> = fallbackProjects
    let awards: Array<Record<string, unknown>> = fallbackAwards
    let memberCount = 0

    try {
      const db = await getDb()
      const [databaseEvents, databaseProjects, databaseAwards, members] = await Promise.all([
        db.collection("events").find({}).sort({ date: -1 }).toArray(),
        db.collection("projects").find({}).sort({ date: -1 }).toArray(),
        db.collection("awards").find({}).sort({ year: -1 }).toArray(),
        db.collection("members").countDocuments({ status: "active" }),
      ])
      if (databaseEvents.length) events = databaseEvents
      if (databaseProjects.length) projects = databaseProjects
      if (databaseAwards.length) awards = databaseAwards
      memberCount = members
    } catch {
      // Public fallback content keeps Satout available when MongoDB is temporarily offline.
    }

    const upcoming = events
      .filter((event) => event.eventType === "upcoming")
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))

    if (/^(hi|hello|hey|bonjour|salut|bonsoir)\b/.test(prompt)) {
      return response("Hi! I’m Satout, your IEEE SIGHT ISIMM Assistant. I can help you discover our projects, events, opportunities, impact, SDGs, team, and membership options.")
    }

    if (/(event|evenement|session|workshop|conference|upcoming|prochain)/.test(prompt)) {
      if (!upcoming.length) return response("There are no upcoming events announced right now. You can still explore our previous SIGHT activities on the Events page.", [{ label: "Explore events", href: "/events" }])
      const names = listTitles(upcoming, 3)
      return response(`Our next announced event${names.length > 1 ? "s are" : " is"}: ${names.join(", ")}. Open the Events page for dates, locations, and registration details.`, [{ label: "View upcoming events", href: "/events#upcoming-events" }])
    }

    if (/(project|projet|innovation|solution|bluetech|ecostem|learno|safe)/.test(prompt)) {
      const names = listTitles(projects, 4)
      return response(`IEEE SIGHT ISIMM develops humanitarian technology projects with communities. Featured initiatives include ${names.join(", ")}.`, [{ label: "Explore projects", href: "/projects" }, { label: "Our SDGs", href: "/sdgs" }])
    }

    if (/(opportunit|join|rejoindre|adhesion|member|membre|volunteer|benevol)/.test(prompt)) {
      const eventNote = upcoming.length ? ` Our next opportunity is ${String(upcoming[0].title || "an upcoming SIGHT event")}.` : ""
      return response(`You can join our activities, volunteer in humanitarian projects, or collaborate with the group.${eventNote} Member accounts are created by the ExCom.`, [{ label: "Join SIGHT", href: "/join" }, { label: "Contact us", href: "/contact" }, { label: "Member login", href: "/login" }])
    }

    if (/(impact|stat|people|community|communaute|award|prix|trophee)/.test(prompt)) {
      const members = memberCount ? `, supported by ${memberCount} active registered members` : ""
      return response(`Our current platform highlights ${projects.length} projects, ${events.length} events, and ${awards.length} awards${members}. These activities connect technology, volunteering, and sustainable community impact.`, [{ label: "View impact", href: "/impact" }, { label: "Our awards", href: "/awards" }])
    }

    if (/(sdg|odd|sustainable|durable|climate|education|water|environment)/.test(prompt)) {
      return response("Our work is guided by the United Nations Sustainable Development Goals, especially education, innovation, sustainable communities, climate action, and life below water.", [{ label: "Explore all SDGs", href: "/sdgs" }, { label: "SIGHT impact", href: "/impact" }])
    }

    if (/(team|committee|excom|bureau|chair|responsable)/.test(prompt)) {
      return response("The IEEE SIGHT ISIMM ExCom coordinates projects, events, membership, partnerships, and humanitarian impact for the current mandate.", [{ label: "Meet the team", href: "/committee" }])
    }

    if (/(contact|email|mail|facebook|instagram|linkedin|tiktok|youtube|location|adresse)/.test(prompt)) {
      return response("You can contact IEEE SIGHT ISIMM at sight-isimm@ieee.tn or through our official social media pages. We are based at ISIMM in Monastir, Tunisia.", [{ label: "Contact SIGHT", href: "/contact" }, { label: "Send an email", href: "mailto:sight-isimm@ieee.tn" }])
    }

    if (/(about|who|qui|sight|mission|humanitarian|humanitaire)/.test(prompt)) {
      return response("IEEE SIGHT ISIMM brings together students, engineers, volunteers, and community partners to design technology with communities and for communities. Our mission is meaningful, sustainable humanitarian impact.", [{ label: "About our SIGHT Group", href: "/about" }])
    }

    return response("I can help you with SIGHT projects, upcoming events, opportunities, impact, SDGs, the ExCom team, membership, or contact information. Try asking: “What are your upcoming events?”", [{ label: "Explore the website", href: "/" }, { label: "Contact the ExCom", href: "/contact" }])
  } catch {
    return NextResponse.json({ success: false, message: "Satout is temporarily unavailable. Please try again." }, { status: 500 })
  }
}
