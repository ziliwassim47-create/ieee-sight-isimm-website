"use client"

import { useCallback, useEffect, useState } from "react"
import { FolderKanban, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ProjectMembership = { _id: string; role?: string; status?: string; joinedAt?: string; project?: { title?: string; description?: string; status?: string; date?: string; displayType?: string; projectType?: string } }

export function MemberProjects() {
  const [items, setItems] = useState<ProjectMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await fetch("/api/members/projects", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Failed to load projects")
      setItems(result.data || [])
      setError("")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Failed to load projects") }
    finally { if (!silent) setLoading(false) }
  }, [])
  useEffect(() => {
    load()
    const refresh = () => load(true)
    const interval = window.setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh) }
  }, [load])
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">{error}</div>
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">My Projects</h1><p className="mt-2 text-muted-foreground">Projects assigned by the ExCom appear here automatically.</p></div>{items.length ? <div className="grid gap-5 md:grid-cols-2">{items.map((item) => <Card key={item._id}><CardHeader><div className="mb-3 inline-flex w-fit rounded-full bg-primary/10 p-3 text-primary"><FolderKanban className="h-6 w-6" /></div><CardTitle>{item.project?.title || "SIGHT Project"}</CardTitle><CardDescription>{item.role || "Project Member"} • {item.project?.status || item.status || "Active"}</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.project?.description || "Humanitarian technology project."}</p><p className="mt-4 text-xs font-semibold text-primary">{item.project?.displayType || item.project?.projectType || "SIGHT Project"}</p></CardContent></Card>)}</div> : <div className="rounded-xl border border-dashed p-12 text-center"><FolderKanban className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 font-semibold">No assigned projects yet</p></div>}</div>
}
