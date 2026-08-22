"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Award, CalendarDays, FolderKanban, MapPin, Newspaper, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { contentHref } from "@/lib/slug"

type Project = { _id: string; title: string; description: string; date: string; status: string; displayType?: string; projectType?: string; imageUrls?: string[]; imageUrl?: string }
type Event = { _id: string; title: string; description: string; date: string; dateIsProvisional?: boolean; location: string; attendees?: number; eventType?: string; images?: string[] }
type News = { _id: string; title: string; summary: string; date: string; category: string; imageUrls?: string[]; imageUrl?: string }
type AwardItem = { _id: string; title: string; year: number; description?: string; imageUrls?: string[]; imageUrl?: string }

const fallbackEvents: Event[] = [
  { _id: "international-sight-day", title: "International SIGHT Day", description: "A community day celebrating humanitarian technology and local action.", date: "2025-04-28", location: "ISIMM, Monastir", images: ["/images/events/international-sight-day.jpg"] },
  { _id: "blender-workshop", title: "Blender Workshop", description: "Practical digital creation training for students and young innovators.", date: "2025-03-15", location: "ISIMM, Monastir", images: ["/images/events/blender.jpg"] },
  { _id: "3ich-ieee", title: "3ich IEEE", description: "A welcoming experience connecting students with IEEE opportunities and volunteering.", date: "2025-02-10", location: "ISIMM, Monastir", images: ["/images/events/3ich-ieee.jpg"] },
]

function imageOf(item: { imageUrls?: string[]; imageUrl?: string; images?: string[] }, fallback = "/placeholder.svg") {
  return item.imageUrls?.[0] || item.images?.[0] || item.imageUrl || fallback
}

function SectionHeading({ eyebrow, title, copy, href, linkLabel }: { eyebrow: string; title: string; copy: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">{eyebrow}</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2><p className="mt-3 max-w-2xl text-muted-foreground">{copy}</p></div>
      {href && <Button asChild variant="ghost" className="self-start text-primary md:self-auto"><Link href={href}>{linkLabel} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
    </div>
  )
}

export function HomeLiveSections() {
  const [projects, setProjects] = useState<Project[]>([])
  const [events, setEvents] = useState<Event[]>(fallbackEvents)
  const [news, setNews] = useState<News[]>([])
  const [awards, setAwards] = useState<AwardItem[]>([])
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    let active = true
    Promise.allSettled([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/news").then((r) => r.json()),
      fetch("/api/awards").then((r) => r.json()),
      fetch("/api/members/count").then((r) => r.json()),
    ]).then(([projectResult, eventResult, newsResult, awardResult, memberResult]) => {
      if (!active) return
      if (projectResult.status === "fulfilled" && projectResult.value.success) setProjects(projectResult.value.data || [])
      if (eventResult.status === "fulfilled" && eventResult.value.success && eventResult.value.data?.length) setEvents(eventResult.value.data)
      if (newsResult.status === "fulfilled" && newsResult.value.success) setNews(newsResult.value.data || [])
      if (awardResult.status === "fulfilled" && awardResult.value.success) setAwards(awardResult.value.data || [])
      if (memberResult.status === "fulfilled" && memberResult.value.success) setMemberCount(Number(memberResult.value.data?.count) || 0)
    })
    return () => { active = false }
  }, [])

  const featuredProjects = projects.slice(0, 3)
  const latestEvents = [...events].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3)

  return (
    <>
      <section className="border-b bg-background py-16 lg:py-20" aria-labelledby="about-sight-group">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/.12)]" aria-hidden="true" />
              Who Are We?
            </div>

            <h2 id="about-sight-group" className="mt-7 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              About <span className="text-primary">Our SIGHT Group</span>
            </h2>

            <div className="mt-8 max-w-4xl space-y-5 text-lg leading-8 text-muted-foreground">
              <p>
                The <strong className="font-semibold text-foreground">IEEE Special Interest Group on Humanitarian Technology (SIGHT)</strong> is a global network of IEEE volunteers committed to using technology to address real-world challenges and contribute to <strong className="font-semibold text-foreground">sustainable development</strong>.
              </p>
              <p>
                At <strong className="font-semibold text-foreground">IEEE SIGHT ISIMM Student Branch Group</strong>, we bring together students, engineers, volunteers, and community partners to transform ideas into meaningful actions. Through humanitarian technology projects, workshops, community initiatives, and collaborative programs, we empower young people to develop innovative solutions with a lasting social and environmental impact.
              </p>
              <p>
                Driven by the <strong className="font-semibold text-foreground">United Nations Sustainable Development Goals (SDGs)</strong> and the values of IEEE SIGHT, we believe that technology becomes truly powerful when it is designed <strong className="font-semibold text-foreground">with communities, for communities</strong>.
              </p>
            </div>

            <div className="mt-9 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["Technology for Good", "Community First", "Sustainable Future", "Empowering Changemakers"].map((value) => (
                <div key={value} className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/.12)]" aria-hidden="true" />
                  {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/35 py-10" aria-labelledby="impact-numbers">
        <div className="container mx-auto px-4">
          <h2 id="impact-numbers" className="sr-only">Our impact in numbers</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              [FolderKanban, projects.length, "Projects"],
              [CalendarDays, events.length, "Events"],
              [Users, memberCount, "Members"],
              [Award, awards.length, "Awards"],
            ].map(([Icon, value, label]) => {
              const StatIcon = Icon as typeof Award
              return <div key={label as string} className="rounded-2xl border bg-card p-5 shadow-sm"><StatIcon className="h-5 w-5 text-primary" /><p className="mt-3 text-3xl font-bold tabular-nums">{value as number}</p><p className="text-sm text-muted-foreground">{label as string}</p></div>
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Projects" title="Ideas built into real solutions" copy="Our initiatives connect technical skills with community-defined needs and the UN Sustainable Development Goals." href="/projects" linkLabel="All projects" />
          {featuredProjects.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <Card key={project._id} className="group overflow-hidden shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted"><Image src={imageOf(project)} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" /></div>
                  <CardContent className="p-6"><div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{project.displayType || project.projectType || "Tech for Good"}</span><span className="rounded-full bg-muted px-3 py-1">{project.status}</span></div><h3 className="mt-4 text-xl font-bold">{project.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{project.description}</p><Link href={contentHref("projects", project)} className="mt-5 inline-flex items-center font-semibold text-primary">View case study <ArrowRight className="ml-2 h-4 w-4" /></Link></CardContent>
                </Card>
              ))}
            </div>
          ) : <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center text-muted-foreground">Project case studies are being prepared. Discover our recent activities below.</div>}
        </div>
      </section>

      <section className="bg-muted/40 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Events" title="Learn, build and serve together" copy="Workshops, awareness campaigns and hands-on humanitarian technology activities." href="/events" linkLabel="All events" />
          <div className="grid gap-6 md:grid-cols-3">
            {latestEvents.map((event) => (
              <article key={event._id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="relative aspect-video bg-muted"><Image src={imageOf(event, "/images/events/international-sight-day.jpg")} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" /></div>
                <div className="p-5"><time className="text-sm font-semibold text-primary">{event.dateIsProvisional ? `${new Date(event.date).getFullYear()} · date to confirm` : new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time><h3 className="mt-2 text-xl font-bold">{event.title}</h3><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{event.location}</p><Link href={contentHref("events", event)} className="mt-4 inline-flex items-center text-sm font-semibold text-primary">View event <ArrowRight className="ml-2 h-4 w-4" /></Link></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Sustainable Development Goals" title="Impact aligned with global goals" copy="We use the SDGs as a practical framework for local engineering and community action." href="/sdgs" linkLabel="Explore all SDGs" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[[4,"Quality Education","Skills and accessible learning"],[9,"Industry & Innovation","Responsible technology solutions"],[13,"Climate Action","Community resilience and awareness"]].map(([number,title,copy]) => <Link key={number} href="/sdgs" className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"><Image src={`/images/sdgs/sdg${number}.png`} alt={`SDG ${number}`} width={72} height={72} className="rounded-lg" /><div><h3 className="font-bold">SDG {number} · {title}</h3><p className="mt-1 text-sm text-muted-foreground">{copy}</p></div></Link>)}
          </div>
        </div>
      </section>

      {(awards.length > 0 || news.length > 0) && <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2">
          <div><SectionHeading eyebrow="Recognition" title="Latest awards" copy="Recognition of the teams and initiatives behind our impact." href="/awards" linkLabel="Awards timeline" /><div className="space-y-3">{awards.slice(0,3).map((item) => <div key={item._id} className="flex gap-4 rounded-xl border bg-card p-4"><Award className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.year}{item.description ? ` · ${item.description}` : ""}</p></div></div>)}</div></div>
          <div><SectionHeading eyebrow="News" title="From our community" copy="Announcements, opportunities and stories from SIGHT ISIMM." href="/news" linkLabel="All news" /><div className="space-y-3">{news.slice(0,3).map((item) => <Link key={item._id} href={contentHref("news", item)} className="flex gap-4 rounded-xl border bg-card p-4 transition hover:border-primary/40"><Newspaper className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p></div></Link>)}</div></div>
        </div>
      </section>}

      <section className="border-t py-12">
        <div className="container mx-auto px-4 text-center"><p className="text-sm font-semibold uppercase tracking-[.18em] text-muted-foreground">Part of the IEEE</p><div className="mt-7 flex flex-wrap items-center justify-center gap-10"><Image src="/logos/logo-isimm-sb.png" alt="IEEE ISIMM Student Branch" width={190} height={70} className="h-14 w-auto object-contain dark:brightness-0 dark:invert" /><Image src="/logos/ieee-tunisia-logo.png" alt="IEEE Tunisia Section" width={190} height={70} className="h-14 w-auto object-contain dark:brightness-0 dark:invert" /><Image src="/logos/sight-tunisia-section-logo.png" alt="IEEE SIGHT Tunisia Section" width={190} height={70} className="h-14 w-auto object-contain dark:brightness-0 dark:invert" /></div></div>
      </section>
    </>
  )
}
