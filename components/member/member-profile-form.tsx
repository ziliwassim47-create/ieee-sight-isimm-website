"use client"

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import { Camera, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PublicMember } from "@/lib/member-types"

const departments = [
  "Computer Science", "Mathematics", "Electronics / EEA",
  "Information & Communication Technologies (ICT)", "Integrated Preparatory Cycle",
  "Engineering", "Master's Program",
] as const

const studyLevels = [
  "Licence 1", "Licence 2", "Licence 3", "Preparatory Cycle 1", "Preparatory Cycle 2",
  "Engineering Cycle 1", "Engineering Cycle 2", "Engineering Cycle 3", "Master 1", "Master 2",
  "Graduate / Alumni",
] as const

type ProfileForm = Pick<PublicMember, "firstName" | "lastName" | "university" | "department" | "studyLevel"> & { photoUrl: string }

export function MemberProfileForm() {
  const [member, setMember] = useState<PublicMember | null>(null)
  const [form, setForm] = useState<ProfileForm | null>(null)
  const [loading, setLoading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)

  useEffect(() => {
    fetch("/api/members/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message)
        const item = result.data as PublicMember
        setMember(item)
        setForm({ firstName: item.firstName, lastName: item.lastName, university: item.university, department: item.department, studyLevel: item.studyLevel, photoUrl: item.photoUrl || "" })
      })
      .catch(() => toast.error("Failed to load profile"))
  }, [])

  if (!member || !form) return <div className="h-64 animate-pulse rounded-xl bg-muted" />

  const set = (field: keyof ProfileForm, value: string) => setForm({ ...form, [field]: value })

  const uploadPhoto = async (file?: File) => {
    if (!file) return
    const data = new FormData()
    data.append("photo", file)
    try {
      setPhotoUploading(true)
      const response = await fetch("/api/members/photo", { method: "POST", body: data })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      const photoUrl = String(result.data.photoUrl)
      setForm({ ...form, photoUrl })
      setMember({ ...member, photoUrl })
      window.dispatchEvent(new CustomEvent("member-photo-updated", { detail: photoUrl }))
      toast.success("Profile photo updated")
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Failed to upload profile photo")
    } finally {
      setPhotoUploading(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.university.trim() || !form.department.trim() || !form.studyLevel.trim()) {
      toast.error("Complete all personal information fields")
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/members/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      setMember(result.data)
      toast.success("Profile updated")
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const standardUniversity = form.university === "ISIMM"
  const standardDepartment = (departments as readonly string[]).includes(form.department)
  const standardStudyLevel = (studyLevels as readonly string[]).includes(form.studyLevel)

  return (
    <form onSubmit={submit} className="space-y-6">
      <div><h1 className="text-3xl font-bold">My Profile</h1><p className="mt-2 text-muted-foreground">Your member information in IEEE SIGHT ISIMM.</p></div>
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle><CardDescription>{member.email} • IEEE ID {member.ieeeMemberId}</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-5 rounded-xl border bg-muted/30 p-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-primary text-primary-foreground">
              {form.photoUrl ? <Image src={form.photoUrl} alt={`${form.firstName} ${form.lastName}`} fill sizes="96px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-2xl font-bold">{form.firstName[0]}{form.lastName[0]}</span>}
            </div>
            <div>
              <Label htmlFor="member-photo" className="mb-2 block">Profile photo</Label>
              <Button type="button" variant="outline" asChild disabled={photoUploading}><label htmlFor="member-photo" className="cursor-pointer">{photoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}Choose photo</label></Button>
              <Input id="member-photo" type="file" accept="image/*" className="sr-only" onChange={(event) => uploadPhoto(event.target.files?.[0])} disabled={photoUploading} />
              <p className="mt-2 text-xs text-muted-foreground">JPG, PNG or WebP, maximum 3 MB.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>First name</Label><Input value={form.firstName} onChange={(event) => set("firstName", event.target.value)} /></div>
            <div className="space-y-2"><Label>Last name</Label><Input value={form.lastName} onChange={(event) => set("lastName", event.target.value)} /></div>
            <div className="space-y-2">
              <Label>University</Label>
              <Select value={standardUniversity ? "ISIMM" : "Other institution"} onValueChange={(value) => set("university", value === "ISIMM" ? "ISIMM" : "")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ISIMM">ISIMM</SelectItem><SelectItem value="Other institution">Other institution</SelectItem></SelectContent></Select>
              {!standardUniversity && <Input value={form.university} onChange={(event) => set("university", event.target.value)} placeholder="Institution name" />}
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={standardDepartment ? form.department : "Other"} onValueChange={(value) => set("department", value === "Other" ? "" : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{departments.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}<SelectItem value="Other">Other</SelectItem></SelectContent></Select>
              {!standardDepartment && <Input value={form.department} onChange={(event) => set("department", event.target.value)} placeholder="Department name" />}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Study level</Label>
              <Select value={standardStudyLevel ? form.studyLevel : "Other"} onValueChange={(value) => set("studyLevel", value === "Other" ? "" : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{studyLevels.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}<SelectItem value="Other">Other</SelectItem></SelectContent></Select>
              {!standardStudyLevel && <Input value={form.studyLevel} onChange={(event) => set("studyLevel", event.target.value)} placeholder="Study level" />}
            </div>
          </div>
        </CardContent>
      </Card>
      <Button type="submit" disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Profile</Button>
    </form>
  )
}
