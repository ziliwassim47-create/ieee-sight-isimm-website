"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Notification = { _id: string; title?: string; message?: string; href?: string; read?: boolean; createdAt?: string }

export function MemberNotifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await fetch("/api/members/notifications", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Failed to load notifications")
      setItems(result.data || [])
      setUnread(result.unread || 0)
      setError("")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Failed to load notifications") }
    finally { if (!silent) setLoading(false) }
  }, [])
  useEffect(() => {
    load()
    const refresh = () => load(true)
    const interval = window.setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh) }
  }, [load])
  const markAllRead = async () => {
    await fetch("/api/members/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) })
    await load(true)
    window.dispatchEvent(new Event("member-notifications-updated"))
  }
  const markRead = async (id: string) => {
    await fetch("/api/members/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    window.dispatchEvent(new Event("member-notifications-updated"))
  }
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">{error}</div>
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold">Notifications</h1><p className="mt-2 text-muted-foreground">{unread} unread update{unread === 1 ? "" : "s"} from IEEE SIGHT ISIMM.</p></div>{unread > 0 && <Button variant="outline" onClick={markAllRead}><CheckCheck className="mr-2 h-4 w-4" />Mark all as read</Button>}</div><div className="space-y-3">{items.map((item) => { const content = <Card className={item.read ? "opacity-70" : "border-primary/30 bg-primary/5"}><CardContent className="flex gap-4 p-5"><div className="mt-1 rounded-full bg-primary/10 p-2 text-primary"><Bell className="h-4 w-4" /></div><div><p className="font-bold">{item.title || "SIGHT notification"}</p><p className="mt-1 text-sm text-muted-foreground">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p></div></CardContent></Card>; return item.href ? <Link key={item._id} href={item.href} onClick={() => { if (!item.read) markRead(item._id) }}>{content}</Link> : <div key={item._id} onClick={() => { if (!item.read) markRead(item._id) }}>{content}</div> })}{!items.length && <div className="rounded-xl border border-dashed p-12 text-center"><Bell className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 font-semibold">No notifications yet</p></div>}</div></div>
}
