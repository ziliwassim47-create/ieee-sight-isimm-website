"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Award, CalendarDays, Clock3, FolderKanban, Handshake, Target, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Event = { _id: string; date: string; eventType?: string }
type Project = { _id: string; date: string; status?: string; displayType?: string; projectType?: string }
type AwardItem = { _id: string }

export function ImpactDashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [awards, setAwards] = useState<AwardItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.allSettled([fetch("/api/events").then(r => r.json()), fetch("/api/projects").then(r => r.json()), fetch("/api/awards").then(r => r.json())]).then(([e,p,a]) => {
      if (e.status === "fulfilled" && e.value.success) setEvents(e.value.data || [])
      if (p.status === "fulfilled" && p.value.success) setProjects(p.value.data || [])
      if (a.status === "fulfilled" && a.value.success) setAwards(a.value.data || [])
      setReady(true)
    })
  }, [])

  const completed = projects.filter(project => project.status === "Completed").length
  const yearly = useMemo(() => {
    const counts = new Map<number, { events: number; projects: number }>()
    events.forEach(event => { const year = new Date(event.date).getFullYear(); if (!Number.isFinite(year)) return; const row = counts.get(year) || { events: 0, projects: 0 }; row.events++; counts.set(year, row) })
    projects.forEach(project => { const year = new Date(project.date).getFullYear(); if (!Number.isFinite(year)) return; const row = counts.get(year) || { events: 0, projects: 0 }; row.projects++; counts.set(year, row) })
    return [...counts.entries()].sort(([a],[b]) => a-b)
  }, [events, projects])
  const maxActivity = Math.max(1, ...yearly.map(([, row]) => row.events + row.projects))

  const metrics = [
    [CalendarDays, events.length, "Published events"], [FolderKanban, projects.length, "Projects"],
    [Target, completed, "Completed projects"], [Award, awards.length, "Awards"], [Handshake, "IEEE", "Global network"],
  ]

  return (
    <div className="container mx-auto space-y-14 px-4 py-14">
      <section aria-labelledby="impact-kpis"><h2 id="impact-kpis" className="sr-only">Key indicators</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{metrics.map(([Icon,value,label]) => { const MetricIcon = Icon as typeof Award; return <Card key={label as string}><CardContent className="p-5 sm:p-6"><MetricIcon className="h-5 w-5 text-primary" /><p className="mt-4 text-3xl font-bold">{ready ? String(value) : "—"}</p><p className="mt-1 text-sm text-muted-foreground">{label as string}</p></CardContent></Card> })}</div></section>
      <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <Card><CardHeader><CardTitle>Activity by year</CardTitle></CardHeader><CardContent>{yearly.length ? <div className="space-y-5">{yearly.map(([year,row]) => <div key={year}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{year}</span><span className="text-muted-foreground">{row.events} events · {row.projects} projects</span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-red-400" style={{ width: `${Math.max(8, ((row.events + row.projects) / maxActivity) * 100)}%` }} /></div></div>)}</div> : <p className="py-12 text-center text-muted-foreground">Yearly data will appear as activities are published.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>What we measure</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-muted-foreground"><p className="flex gap-3"><Users className="h-5 w-5 shrink-0 text-primary" />Participation recorded on published events.</p><p className="flex gap-3"><FolderKanban className="h-5 w-5 shrink-0 text-primary" />Projects from planning through completion.</p><p className="flex gap-3"><Clock3 className="h-5 w-5 shrink-0 text-primary" />Volunteer hours will be added when the member module is activated.</p></CardContent></Card>
      </section>
      <section className="rounded-3xl bg-slate-950 p-8 text-white sm:p-10"><p className="text-sm font-semibold uppercase tracking-[.18em] text-red-300">Impact stories</p><h2 className="mt-3 text-3xl font-bold">Explore the work behind the numbers</h2><p className="mt-3 max-w-2xl text-slate-300">Every indicator represents people learning, teams building and communities shaping better solutions.</p><div className="mt-7 flex flex-wrap gap-3"><Button asChild><Link href="/projects">Project case studies</Link></Button><Button asChild variant="outline" className="border-slate-600 bg-transparent text-white hover:bg-slate-800 hover:text-white"><Link href="/sdgs">SDG contributions</Link></Button></div></section>
    </div>
  )
}
