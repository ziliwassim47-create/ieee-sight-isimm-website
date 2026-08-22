"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarCheck2, CalendarPlus, CheckCircle2, Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Event = { _id: string; title?: string; description?: string; date?: string; location?: string }
type Registration = { _id: string; eventId: string; attendanceStatus?: string; status?: string; registeredAt?: string; event?: Event }

export function MemberEvents() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState("")
  const [error, setError] = useState("")

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await fetch("/api/members/events", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Failed to load events")
      setRegistrations(result.data?.registrations || [])
      setUpcomingEvents(result.data?.upcomingEvents || [])
      setError("")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to load events")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const refresh = () => load(true)
    const interval = window.setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh) }
  }, [load])

  const registeredIds = useMemo(() => new Set(registrations.map((item) => item.eventId || item.event?._id)), [registrations])
  const register = async (eventId: string) => {
    try {
      setBusyId(eventId)
      const response = await fetch(`/api/events/${eventId}/register`, { method: "POST" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Registration failed")
      toast.success(result.message || "Registration confirmed")
      await load(true)
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Registration failed")
    } finally {
      setBusyId("")
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">{error}</div>

  return <div className="space-y-8">
    <div><h1 className="text-3xl font-bold">My Events</h1><p className="mt-2 text-muted-foreground">Your registrations and attendance are synchronized automatically with ExCom updates.</p></div>
    <section><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><CalendarPlus className="h-5 w-5 text-primary" />Upcoming Events</h2><div className="grid gap-4 md:grid-cols-2">{upcomingEvents.map((event) => <Card key={event._id}><CardHeader><CardTitle>{event.title || "SIGHT Event"}</CardTitle><CardDescription>{event.date || "Date to be announced"}</CardDescription></CardHeader><CardContent><p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>{event.location && <p className="mt-3 flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />{event.location}</p>}<Button className="mt-5" onClick={() => register(event._id)} disabled={registeredIds.has(event._id) || busyId === event._id}>{registeredIds.has(event._id) ? <><CheckCircle2 className="mr-2 h-4 w-4" />Registered</> : busyId === event._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}</Button></CardContent></Card>)}{!upcomingEvents.length && <Empty text="No upcoming events." />}</div></section>
    <section><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><CalendarCheck2 className="h-5 w-5 text-primary" />My Event History</h2><div className="space-y-3">{registrations.map((item) => <Card key={item._id}><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{item.event?.title || "SIGHT Event"}</p><p className="mt-1 text-sm text-muted-foreground">{item.event?.date || ""}{item.event?.location ? ` • ${item.event.location}` : ""}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${item.attendanceStatus === "present" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>{item.attendanceStatus === "present" ? "Present" : item.attendanceStatus === "absent" ? "Absent" : "Registered"}</span></CardContent></Card>)}{!registrations.length && <Empty text="No event registrations yet." />}</div></section>
  </div>
}

function Empty({ text }: { text: string }) { return <div className="col-span-full rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{text}</div> }
