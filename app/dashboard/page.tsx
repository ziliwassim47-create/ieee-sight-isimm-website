"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Award, CalendarCheck2, FolderKanban, Medal, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type DashboardData = {
  member: { firstName: string; lastName: string; role: string; status: string }
  memberLevel: string
  kpis: { eventsAttended: number; volunteerHours: number; projects: number; certificates: number; badges: number; achievements: number; sightPoints: number }
  nextEvent: { _id: string; title: string; date: string; location?: string } | null
  projects: Array<{ _id: string; title: string; status?: string }>
  notifications: Array<{ _id: string; title?: string; message?: string; createdAt?: string }>
}

const kpiDefinitions = [
  ["Events attended", "eventsAttended", CalendarCheck2],
  ["Projects", "projects", FolderKanban],
  ["Certificates", "certificates", Award],
  ["Badges", "badges", Medal],
  ["Achievements", "achievements", Star],
  ["SIGHT Points", "sightPoints", Star],
] as const

export default function MemberDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/members/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || "Failed to load dashboard")
        setData(result.data)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load dashboard"))
  }, [])

  if (error) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">{error}</div>
  if (!data) return <div className="h-40 animate-pulse rounded-xl bg-muted" />

  return (
    <div className="space-y-8">
      <div><p className="text-sm font-semibold text-primary">{data.memberLevel}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back, {data.member.firstName} 👋</h1><p className="mt-2 text-muted-foreground">Here is your activity in IEEE SIGHT ISIMM.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpiDefinitions.map(([label, key, Icon]) => <Card key={key}><CardContent className="p-5"><Icon className="mb-4 h-5 w-5 text-primary" /><p className="text-2xl font-black">{data.kpis[key]}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></CardContent></Card>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardDescription>Next Event</CardDescription><CardTitle>{data.nextEvent?.title || "No upcoming event"}</CardTitle></CardHeader><CardContent>{data.nextEvent ? <><p className="text-sm text-muted-foreground">{new Date(data.nextEvent.date).toLocaleDateString()} {data.nextEvent.location ? `• ${data.nextEvent.location}` : ""}</p><Button asChild variant="outline" className="mt-4"><Link href="/dashboard/events">View My Events</Link></Button></> : <p className="text-sm text-muted-foreground">New activities will appear here.</p>}</CardContent></Card>
        <Card><CardHeader><CardDescription>My Projects</CardDescription><CardTitle>Current collaborations</CardTitle></CardHeader><CardContent className="space-y-3">{data.projects.length ? data.projects.map((project) => <div key={project._id} className="rounded-lg border p-3"><p className="font-semibold">{project.title}</p><p className="text-xs text-muted-foreground">{project.status || "Active"}</p></div>) : <p className="text-sm text-muted-foreground">You have not joined a project yet.</p>}</CardContent></Card>
        <Card><CardHeader><CardDescription>Announcements</CardDescription><CardTitle>Latest updates</CardTitle></CardHeader><CardContent className="space-y-3">{data.notifications.length ? data.notifications.map((item) => <div key={item._id} className="border-b pb-3 last:border-0"><p className="font-medium">{item.title || "SIGHT notification"}</p><p className="text-sm text-muted-foreground">{item.message}</p></div>) : <p className="text-sm text-muted-foreground">No new notifications.</p>}</CardContent></Card>
      </div>
    </div>
  )
}
