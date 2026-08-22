"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Download, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { PublicMember } from "@/lib/member-types"

export default function ExComMembersPage() {
  const [members, setMembers] = useState<PublicMember[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/members?status=all", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || "Failed to load members")
        setMembers(result.data || [])
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load members"))
  }, [])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return members
    return members.filter((member) => `${member.firstName} ${member.middleName || ""} ${member.lastName} ${member.email} ${member.ieeeMemberId}`.toLowerCase().includes(value))
  }, [members, query])

  if (error) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-primary">ExCom Management</p><h1 className="mt-1 text-3xl font-bold">Members</h1><p className="mt-2 text-muted-foreground">Select a member to manage their account, attendance, projects, certificates, badges, achievements and SIGHT score.</p></div><Button asChild><a href="/api/admin/scoring/export"><Download className="mr-2 h-4 w-4" />Download full scoring Excel</a></Button></div>
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />{members.length} members</CardTitle><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or IEEE ID" className="pl-9" /></div></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => (
            <Link key={member._id} href={`/dashboard/excom/members/${member._id}`} className="rounded-xl border p-4 transition hover:border-primary hover:bg-primary/5">
              <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{member.firstName} {member.middleName ? `${member.middleName} ` : ""}{member.lastName}</p><p className="mt-1 text-sm text-muted-foreground">{member.email}</p><p className="mt-1 text-xs text-muted-foreground">IEEE ID {member.ieeeMemberId}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${member.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>{member.status}</span></div>
              <p className="mt-3 text-xs font-medium text-primary">{member.stats?.eventsAttended || 0} events • {member.stats?.projects || 0} projects • {member.stats?.certificates || 0} certificates • {member.stats?.badges || 0} badges • {member.stats?.achievements || 0} achievements • {member.stats?.sightPoints || 0} points</p>
            </Link>
          ))}
          {!filtered.length && <p className="py-10 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">No members match this search.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
