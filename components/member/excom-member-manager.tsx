"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Award, CalendarCheck2, Copy, Eye, EyeOff, FolderKanban, KeyRound, Loader2, Medal, Save, Star, Trash2, Trophy, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PublicMember } from "@/lib/member-types"
import { EVENT_SCORE_ACTIVITIES, GENERAL_SCORE_ACTIVITIES, SCORE_POINTS_PER_ACTIVITY } from "@/lib/scoring"

type ActivityItem = { _id: string; attendanceStatus?: string; role?: string; title?: string; type?: string; code?: string; name?: string; description?: string; contribution?: string; activityLabel?: string; comment?: string; points?: number; createdAt?: string; event?: { title?: string; date?: string }; project?: { title?: string }; award?: { title?: string; year?: number } }
type Option = { _id: string; title: string; date?: string; year?: number }
type ManagerData = { member: PublicMember; score: number; memberLevel: string; scoreEntries: ActivityItem[]; registrations: ActivityItem[]; projectMemberships: ActivityItem[]; certificates: ActivityItem[]; badges: ActivityItem[]; achievements: ActivityItem[]; options: { events: Option[]; projects: Option[]; awards: Option[] } }
type MemberForm = { firstName: string; middleName: string; lastName: string; email: string; password: string; ieeeMemberId: string; university: string; department: string; studyLevel: string; status: string }

export function ExComMemberManager({ memberId }: { memberId: string }) {
  const [data, setData] = useState<ManagerData | null>(null)
  const [form, setForm] = useState<MemberForm | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [eventId, setEventId] = useState("")
  const [eventScoreActivities, setEventScoreActivities] = useState<string[]>([])
  const [eventComments, setEventComments] = useState<Record<string, string>>({})
  const [projectId, setProjectId] = useState("")
  const [projectRole, setProjectRole] = useState("Project Member")
  const [certificateTitle, setCertificateTitle] = useState("")
  const [certificateType, setCertificateType] = useState("Participation")
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [badgeName, setBadgeName] = useState("")
  const [badgeDescription, setBadgeDescription] = useState("")
  const [awardId, setAwardId] = useState("")
  const [contribution, setContribution] = useState("")
  const [generalScoreActivities, setGeneralScoreActivities] = useState<string[]>([])
  const [generalComments, setGeneralComments] = useState<Record<string, string>>({})
  const [revealedPassword, setRevealedPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [credentialMessage, setCredentialMessage] = useState("")

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/members/${memberId}/activity`, { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Failed to load member")
      const value = result.data as ManagerData
      setData(value)
      setForm({ firstName: value.member.firstName, middleName: value.member.middleName || "", lastName: value.member.lastName, email: value.member.email, password: "", ieeeMemberId: value.member.ieeeMemberId, university: value.member.university, department: value.member.department, studyLevel: value.member.studyLevel, status: value.member.status })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to load member")
    }
  }, [memberId])

  useEffect(() => { load() }, [load])

  const action = async (body: Record<string, unknown>, successMessage: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/members/${memberId}/activity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      toast.success(result.message || successMessage)
      await load()
      return true
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Update failed")
      return false
    } finally {
      setLoading(false)
    }
  }

  const remove = async (type: string, itemId: string) => {
    if (!window.confirm("Remove this item from the member account?")) return
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/members/${memberId}/activity?type=${encodeURIComponent(type)}&itemId=${encodeURIComponent(itemId)}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      toast.success("Item removed")
      await load()
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Removal failed")
    } finally {
      setLoading(false)
    }
  }

  const saveMember = async () => {
    if (!form) return
    if (form.password && form.password.length < 8) return toast.error("The password must contain at least 8 characters")
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/members/${memberId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      if (form.password) {
        setRevealedPassword(form.password)
        setPasswordVisible(true)
        setCredentialMessage("This protected temporary password is now available to authorized ExCom members.")
      }
      toast.success("Member account updated")
      await load()
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Failed to update member")
    } finally {
      setLoading(false)
    }
  }

  const revealCredential = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/members/${memberId}/credential`, { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      if (!result.available) {
        setCredentialMessage(result.message || "Set a new temporary password first.")
        setRevealedPassword("")
        return
      }
      setRevealedPassword(result.password)
      setPasswordVisible(true)
      setCredentialMessage(result.changedAt ? `Password last set ${new Date(result.changedAt).toLocaleString()}` : "Protected password available")
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Password access failed")
    } finally {
      setLoading(false)
    }
  }

  const uploadCertificate = async () => {
    if (!certificateTitle.trim() || !certificateFile) return
    const formData = new FormData()
    formData.append("title", certificateTitle.trim())
    formData.append("type", certificateType.trim() || "Participation")
    formData.append("file", certificateFile)
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/members/${memberId}/certificate-upload`, { method: "POST", body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      setCertificateTitle("")
      setCertificateFile(null)
      toast.success("Certificate uploaded")
      await load()
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Certificate upload failed")
    } finally {
      setLoading(false)
    }
  }

  if (error) return <div className="space-y-4"><Button asChild variant="ghost"><Link href="/dashboard/excom"><ArrowLeft className="mr-2 h-4 w-4" />Members</Link></Button><div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">{error}</div></div>
  if (!data || !form) return <div className="h-64 animate-pulse rounded-xl bg-muted" />

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost"><Link href="/dashboard/excom"><ArrowLeft className="mr-2 h-4 w-4" />All members</Link></Button>
      <div><p className="text-sm font-semibold text-primary">ExCom Member Management</p><h1 className="mt-1 text-3xl font-bold">{data.member.firstName} {data.member.middleName ? `${data.member.middleName} ` : ""}{data.member.lastName}</h1><p className="mt-2 text-muted-foreground">{data.member.email} • IEEE ID {data.member.ieeeMemberId}</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[[CalendarCheck2, data.registrations.filter((item) => item.attendanceStatus === "present").length, "Events"], [FolderKanban, data.projectMemberships.length, "Projects"], [Award, data.certificates.length, "Certificates"], [Medal, data.badges.length, "Badges"], [Trophy, data.achievements.length, "Achievements"], [Star, data.score, data.memberLevel]].map(([Icon, value, label]) => { const StatIcon = Icon as typeof Star; return <Card key={label as string}><CardContent className="p-5"><StatIcon className="h-5 w-5 text-primary" /><p className="mt-3 text-2xl font-black">{value as number}</p><p className="text-xs text-muted-foreground">{label as string}</p></CardContent></Card> })}
      </div>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />Account information</CardTitle><CardDescription>Full access to personal information, account status and password reset.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>First name</Label><Input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></div>
        <div className="space-y-2"><Label>Last name</Label><Input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></div>
        <div className="space-y-2"><Label>Middle name</Label><Input value={form.middleName} onChange={(event) => setForm({ ...form, middleName: event.target.value })} /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
        <div className="space-y-2"><Label>IEEE Member ID</Label><Input value={form.ieeeMemberId} onChange={(event) => setForm({ ...form, ieeeMemberId: event.target.value })} /></div>
        <div className="space-y-2"><Label>New temporary password</Label><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Leave empty to keep current password" /></div>
        <div className="space-y-2"><Label>University</Label><Input value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} /></div>
        <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></div>
        <div className="space-y-2"><Label>Study level</Label><Input value={form.studyLevel} onChange={(event) => setForm({ ...form, studyLevel: event.target.value })} /></div>
        <div className="space-y-2"><Label>Account status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select></div>
      </div><div className="rounded-xl border bg-muted/20 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1 space-y-2"><Label>Protected member password</Label><div className="relative"><Input readOnly type={passwordVisible ? "text" : "password"} value={revealedPassword} placeholder="Click Reveal password" className="pr-12 font-mono" /><Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1" onClick={() => setPasswordVisible(!passwordVisible)} disabled={!revealedPassword} aria-label={passwordVisible ? "Hide password" : "Show password"}>{passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div>{credentialMessage && <p className="text-xs text-muted-foreground">{credentialMessage}</p>}</div><Button type="button" variant="outline" onClick={revealCredential} disabled={loading}><KeyRound className="mr-2 h-4 w-4" />Reveal password</Button><Button type="button" variant="outline" onClick={() => { if (revealedPassword) { navigator.clipboard.writeText(revealedPassword); toast.success("Password copied") } }} disabled={!revealedPassword}><Copy className="mr-2 h-4 w-4" />Copy</Button></div><p className="mt-3 text-xs text-muted-foreground">Access is restricted to authorized ExCom members and every reveal is recorded.</p></div><Button onClick={saveMember} disabled={loading}><Save className="mr-2 h-4 w-4" />Save account</Button></CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityCard title="Attendance sessions" description="Add an event where this member was present" icon={CalendarCheck2}>
          <Select value={eventId} onValueChange={setEventId}><SelectTrigger><SelectValue placeholder="Choose event" /></SelectTrigger><SelectContent>{data.options.events.map((event) => <SelectItem key={event._id} value={event._id}>{event.title}{event.date ? ` — ${event.date}` : ""}</SelectItem>)}</SelectContent></Select>
          <div className="rounded-lg border bg-muted/20 p-3"><p className="text-sm font-semibold">Attendance at an Event <span className="text-primary">+{SCORE_POINTS_PER_ACTIVITY}</span></p><p className="mt-1 text-xs text-muted-foreground">Added automatically when the presence is saved.</p></div>
          <ScoreActivitySelector activities={EVENT_SCORE_ACTIVITIES} selected={eventScoreActivities} comments={eventComments} onSelectedChange={setEventScoreActivities} onCommentChange={(key, value) => setEventComments({ ...eventComments, [key]: value })} />
          <Button onClick={async () => { if (await action({ action: "event", eventId, scoreActivities: eventScoreActivities, comments: eventComments }, "Attendance added")) { setEventScoreActivities([]); setEventComments({}) } }} disabled={loading || !eventId}>Save presence and activities</Button>
          <ItemList items={data.registrations} label={(item) => item.event?.title || "Event"} detail={(item) => item.attendanceStatus || "registered"} onRemove={(id) => remove("event", id)} />
        </ActivityCard>

        <ActivityCard title="Projects" description="Assign this member to a project" icon={FolderKanban}>
          <Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue placeholder="Choose project" /></SelectTrigger><SelectContent>{data.options.projects.map((project) => <SelectItem key={project._id} value={project._id}>{project.title}</SelectItem>)}</SelectContent></Select>
          <Input value={projectRole} onChange={(event) => setProjectRole(event.target.value)} placeholder="Project role" />
          <Button onClick={() => action({ action: "project", projectId, projectRole }, "Project added")} disabled={loading || !projectId}>Add project</Button>
          <ItemList items={data.projectMemberships} label={(item) => item.project?.title || "Project"} detail={(item) => item.role || "Project Member"} onRemove={(id) => remove("project", id)} />
        </ActivityCard>

        <ActivityCard title="Certificates" description="Upload a certificate that the member can download" icon={Award}>
          <Input value={certificateTitle} onChange={(event) => setCertificateTitle(event.target.value)} placeholder="Certificate title" />
          <Input value={certificateType} onChange={(event) => setCertificateType(event.target.value)} placeholder="Participation, Organizer, Trainer..." />
          <Input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(event) => setCertificateFile(event.target.files?.[0] || null)} />
          <Button onClick={uploadCertificate} disabled={loading || !certificateTitle.trim() || !certificateFile}>Upload certificate</Button>
          <ItemList items={data.certificates} label={(item) => item.title || "Certificate"} detail={(item) => `${item.type || "Participation"} • ${item.code || ""}`} onRemove={(id) => remove("certificate", id)} />
        </ActivityCard>

        <ActivityCard title="Badges" description="Award a badge to this member" icon={Medal}>
          <Input value={badgeName} onChange={(event) => setBadgeName(event.target.value)} placeholder="Badge name" />
          <Input value={badgeDescription} onChange={(event) => setBadgeDescription(event.target.value)} placeholder="Description" />
          <Button onClick={() => action({ action: "badge", name: badgeName, description: badgeDescription }, "Badge added")} disabled={loading || !badgeName.trim()}>Add badge</Button>
          <ItemList items={data.badges} label={(item) => item.name || "Badge"} detail={(item) => item.description || "SIGHT member badge"} onRemove={(id) => remove("badge", id)} />
        </ActivityCard>

        <ActivityCard title="Achievements" description="Record the member's contribution to one of the group's awards" icon={Trophy}>
          <Select value={awardId} onValueChange={setAwardId}><SelectTrigger><SelectValue placeholder="Choose an award" /></SelectTrigger><SelectContent>{data.options.awards.map((award) => <SelectItem key={award._id} value={award._id}>{award.title}{award.year ? ` — ${award.year}` : ""}</SelectItem>)}</SelectContent></Select>
          <Input value={contribution} onChange={(event) => setContribution(event.target.value)} placeholder="Member contribution" />
          <Button onClick={() => action({ action: "achievement", awardId, contribution }, "Achievement added")} disabled={loading || !awardId}>Add achievement</Button>
          <ItemList items={data.achievements} label={(item) => item.award?.title || item.title || "Achievement"} detail={(item) => item.contribution || "Contributed to this award"} onRemove={(id) => remove("achievement", id)} />
        </ActivityCard>
      </div>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-primary" />Private SIGHT Scoring</CardTitle><CardDescription>Each selected activity adds exactly +{SCORE_POINTS_PER_ACTIVITY} points. Choices and HR comments are visible only to ExCom accounts.</CardDescription></CardHeader><CardContent className="space-y-4"><ScoreActivitySelector activities={GENERAL_SCORE_ACTIVITIES} selected={generalScoreActivities} comments={generalComments} onSelectedChange={setGeneralScoreActivities} onCommentChange={(key, value) => setGeneralComments({ ...generalComments, [key]: value })} /><Button onClick={async () => { if (await action({ action: "score_activities", scoreActivities: generalScoreActivities, comments: generalComments }, "Scoring activities saved")) { setGeneralScoreActivities([]); setGeneralComments({}) } }} disabled={loading || !generalScoreActivities.length}>Add selected activities</Button><div className="border-t pt-4"><h3 className="mb-3 font-bold">Private scoring history</h3><ItemList items={data.scoreEntries} label={(item) => item.activityLabel || "SIGHT Activity"} detail={(item) => `+${item.points || SCORE_POINTS_PER_ACTIVITY} • ${item.event?.title ? `${item.event.title} • ` : ""}${item.comment || "No HR comment"}`} onRemove={(id) => remove("score_entry", id)} /></div></CardContent></Card>
      {loading && <div className="fixed bottom-6 right-6 rounded-full border bg-background p-3 shadow-lg"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
    </div>
  )
}

function ActivityCard({ title, description, icon: Icon, children }: { title: string; description: string; icon: typeof Award; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" />{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="space-y-3">{children}</CardContent></Card>
}

function ItemList({ items, label, detail, onRemove }: { items: ActivityItem[]; label: (item: ActivityItem) => string; detail: (item: ActivityItem) => string; onRemove: (id: string) => void }) {
  if (!items.length) return <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No items yet.</p>
  return <div className="space-y-2">{items.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className="text-sm font-semibold">{label(item)}</p><p className="text-xs text-muted-foreground">{detail(item)}</p></div><Button type="button" size="icon" variant="ghost" onClick={() => onRemove(item._id)} aria-label="Remove"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}</div>
}

function ScoreActivitySelector({ activities, selected, comments, onSelectedChange, onCommentChange }: { activities: readonly { key: string; label: string }[]; selected: string[]; comments: Record<string, string>; onSelectedChange: (values: string[]) => void; onCommentChange: (key: string, value: string) => void }) {
  return <div className="space-y-3">{activities.map((activity) => { const checked = selected.includes(activity.key); return <div key={activity.key} className="rounded-lg border p-3"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={checked} onChange={(event) => onSelectedChange(event.target.checked ? [...selected, activity.key] : selected.filter((key) => key !== activity.key))} className="mt-1 h-4 w-4 accent-primary" /><span className="flex-1 text-sm font-medium">{activity.label}</span><span className="text-sm font-bold text-primary">+{SCORE_POINTS_PER_ACTIVITY}</span></label>{checked && <div className="mt-3"><Label htmlFor={`comment-${activity.key}`}>HR / ExCom comment *</Label><Input id={`comment-${activity.key}`} value={comments[activity.key] || ""} onChange={(event) => onCommentChange(activity.key, event.target.value)} placeholder="Explain and document this contribution" className="mt-2" /></div>}</div> })}</div>
}
