"use client"

import { ReactNode, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Award, Bell, CalendarDays, FolderKanban, Gauge, LogOut, Menu, UserRound, Users, X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PublicMember } from "@/lib/member-types"

const items = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
  { label: "Events", href: "/dashboard/events", icon: CalendarDays },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Certificates", href: "/dashboard/certificates", icon: Award },
  { label: "Achievements", href: "/dashboard/achievements", icon: Zap },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
]

export function MemberShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [member, setMember] = useState<PublicMember | null>(null)
  const [memberLevel, setMemberLevel] = useState("Member")
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    const loadSession = () => fetch("/api/members/session", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json()
        if (response.status === 401) {
          router.replace("/login")
          return
        }
        if (!response.ok) throw new Error(result.message || "Member space unavailable")
        if (active) {
          setMember(result.member)
          setMemberLevel(result.memberLevel || "Member")
        }
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Member space unavailable"))
    loadSession()
    const interval = window.setInterval(loadSession, 30000)
    return () => { active = false; window.clearInterval(interval) }
  }, [router])

  useEffect(() => {
    if (!member) return
    const loadUnread = () => fetch("/api/members/notifications", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (result) setUnreadNotifications(result.unread || 0) })
      .catch(() => undefined)
    loadUnread()
    const interval = window.setInterval(loadUnread, 30000)
    window.addEventListener("member-notifications-updated", loadUnread)
    return () => { window.clearInterval(interval); window.removeEventListener("member-notifications-updated", loadUnread) }
  }, [member?._id])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const updatePhoto = (event: Event) => {
      const photoUrl = (event as CustomEvent<string>).detail
      if (photoUrl) setMember((current) => current ? { ...current, photoUrl } : current)
    }
    window.addEventListener("member-photo-updated", updatePhoto)
    return () => window.removeEventListener("member-photo-updated", updatePhoto)
  }, [])

  const logout = async () => {
    await fetch("/api/members/session", { method: "DELETE" }).catch(() => null)
    router.push("/login")
    router.refresh()
  }

  if (error) return <div className="mx-auto my-20 max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"><h1 className="font-bold">Member space unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><p className="mt-3 text-xs text-muted-foreground">Configure MONGODB_URI, then restart the application.</p></div>
  if (!member) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" aria-label="Loading member space" /></div>

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-muted/30">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className={`${open ? "fixed inset-y-20 left-0 z-50 flex" : "hidden"} w-72 flex-col border-r bg-background p-4 lg:sticky lg:top-20 lg:flex lg:h-[calc(100vh-5rem)]`}>
          <div className="mb-5 rounded-xl bg-primary/5 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground">
                {member.photoUrl ? <Image src={member.photoUrl} alt={`${member.firstName} ${member.lastName}`} fill sizes="44px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-sm font-bold">{member.firstName[0]}{member.lastName[0]}</span>}
              </div>
              <p className="font-bold">{member.firstName} {member.lastName}</p>
            </div>
            <p className="text-xs text-muted-foreground">IEEE SIGHT ISIMM Member</p>
            <span className="mt-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">{memberLevel}</span>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Member navigation">
            {member.role === "admin" && <Link href="/dashboard/excom" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${pathname.startsWith("/dashboard/excom") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Users className="h-4 w-4" />ExCom Members</Link>}
            {items.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
              const Icon = item.icon
              return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" />{item.label}</Link>
            })}
          </nav>
          <Button variant="outline" onClick={logout} className="mt-4 justify-start"><LogOut className="mr-2 h-4 w-4" />Logout</Button>
        </aside>

        {open && <button type="button" className="fixed inset-0 top-20 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Close member menu" />}

        <div className="min-w-0 flex-1">
          <div className="sticky top-20 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
            <p className="hidden text-sm font-semibold sm:block">SIGHT ISIMM Member & Impact Platform</p>
            <div className="ml-auto flex items-center gap-2"><Button asChild variant="ghost" size="icon"><Link href="/dashboard/notifications" aria-label={`${unreadNotifications} unread notifications`} className="relative"><Bell className="h-5 w-5" />{unreadNotifications > 0 && <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link></Button><Link href="/dashboard/profile" className="relative h-10 w-10 overflow-hidden rounded-full bg-primary text-primary-foreground" aria-label="Open profile">{member.photoUrl ? <Image src={member.photoUrl} alt="Profile" fill sizes="40px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-sm font-bold">{member.firstName[0]}{member.lastName[0]}</span>}</Link></div>
          </div>
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
