"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Medal, Trophy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Badge = { _id: string; name: string; description?: string; awardedAt?: string }
type Achievement = { _id: string; title?: string; contribution?: string; awardedAt?: string; award?: { title?: string; year?: number; description?: string } }

export function MemberAchievements() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    fetch("/api/members/achievements", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || "Failed to load achievements")
        setBadges(result.data?.badges || [])
        setAchievements(result.data?.achievements || [])
        setError("")
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load achievements"))
      .finally(() => { if (!silent) setLoading(false) })
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

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">Achievements & Badges</h1><p className="mt-2 text-muted-foreground">Your badges and recognized contributions to IEEE SIGHT ISIMM awards.</p></div>
      <section><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Trophy className="h-5 w-5 text-primary" />Award Contributions</h2>{achievements.length ? <div className="grid gap-5 md:grid-cols-2">{achievements.map((achievement) => <Card key={achievement._id}><CardHeader><CardTitle>{achievement.award?.title || achievement.title || "SIGHT Achievement"}</CardTitle><CardDescription>{achievement.award?.year || "IEEE SIGHT ISIMM Award"}</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">{achievement.contribution || "Recognized contribution to this award."}</p></CardContent></Card>)}</div> : <EmptyState icon={Trophy} text="No award contributions yet." />}</section>
      <section><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Medal className="h-5 w-5 text-primary" />Badges</h2>{badges.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{badges.map((badge) => <Card key={badge._id}><CardContent className="p-5"><div className="mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary"><Medal className="h-6 w-6" /></div><h3 className="font-bold">{badge.name}</h3><p className="mt-2 text-sm text-muted-foreground">{badge.description || "IEEE SIGHT ISIMM member badge"}</p></CardContent></Card>)}</div> : <EmptyState icon={Medal} text="No badges yet." />}</section>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: typeof Trophy; text: string }) {
  return <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground"><Icon className="mx-auto mb-3 h-8 w-8" />{text}</div>
}
