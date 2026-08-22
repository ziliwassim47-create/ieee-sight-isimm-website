import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Bell, CalendarDays, FolderKanban, Medal, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sections = {
  events: { title: "My Events", description: "Your registrations and attendance history will appear here.", icon: CalendarDays },
  projects: { title: "My Projects", description: "Follow your project roles, team, and assigned tasks.", icon: FolderKanban },
  certificates: { title: "Certificates", description: "View and download your verified SIGHT certificates.", icon: Trophy },
  achievements: { title: "Achievements", description: "Badges and meaningful milestones from your SIGHT journey.", icon: Medal },
  notifications: { title: "Notifications", description: "Certificates, approvals, invitations, events, and announcements.", icon: Bell },
} as const

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params
  return { title: section in sections ? sections[section as keyof typeof sections].title : "Member Space" }
}

export default async function MemberSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!(section in sections)) notFound()
  const item = sections[section as keyof typeof sections]
  const Icon = item.icon
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">{item.title}</h1><p className="mt-2 text-muted-foreground">{item.description}</p></div><Card className="border-dashed"><CardHeader className="items-center text-center"><div className="rounded-full bg-primary/10 p-4 text-primary"><Icon className="h-7 w-7" /></div></CardHeader><CardContent className="text-center text-sm text-muted-foreground">No information is available yet.</CardContent></Card></div>
}
