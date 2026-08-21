import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Target, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { PublicContent } from "@/lib/public-content"

function value(item: PublicContent, key: string) { return typeof item[key] === "string" ? item[key] as string : "" }
function images(item: PublicContent) { const list = Array.isArray(item.imageUrls) ? item.imageUrls as string[] : Array.isArray(item.images) ? item.images as string[] : []; return list.length ? list : value(item, "imageUrl") ? [value(item, "imageUrl")] : [] }
function displayDate(item: PublicContent, long = true) {
  const date = new Date(value(item, "date"))
  if (item.dateIsProvisional) return `${date.getFullYear()} · date to confirm`
  return date.toLocaleDateString("en-GB", long ? { day: "numeric", month: "long", year: "numeric" } : undefined)
}

export function PublicDetail({ item, type }: { item: PublicContent; type: "project" | "event" | "news" }) {
  const section = type === "project" ? "projects" : type === "event" ? "events" : "news"
  const description = value(item, "description") || value(item, "summary")
  const media = images(item)
  const externalLink = value(item, type === "project" ? "proposalFormUrl" : type === "event" ? "registrationLink" : "link")
  const vToolsUrl = value(item, "vToolsUrl")
  const label = type === "project" ? "Project proposal" : type === "event" ? "Registration" : value(item, "linkLabel") || "Related link"

  return <article className="min-h-screen pb-16">
    <header className="border-b bg-muted/35 py-12"><div className="container mx-auto max-w-6xl px-4"><Link href={`/${section}`} className="inline-flex items-center text-sm font-semibold text-primary"><ArrowLeft className="mr-2 h-4 w-4"/>Back to {section}</Link><div className="mt-7 flex flex-wrap gap-2">{[value(item,"status"),value(item,"displayType")||value(item,"projectType"),value(item,"category")].filter(Boolean).map(tag=><span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{tag}</span>)}</div><h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{item.title}</h1><div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground">{value(item,"date")&&<span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary"/>{displayDate(item)}</span>}{value(item,"location")&&<span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary"/>{value(item,"location")}</span>}{Number(item.attendees)>0&&<span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary"/>{String(item.attendees)} attendees</span>}</div></div></header>
    <div className="container mx-auto max-w-6xl px-4 py-10">{media.length>0&&<div className={`grid gap-4 ${media.length>1?"md:grid-cols-2":""}`}>{media.slice(0,4).map((src,index)=><div key={`${src}-${index}`} className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-muted"><Image src={src} alt={`${item.title}${media.length>1?` — photo ${index+1}`:""}`} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover"/></div>)}</div>}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]"><div className="space-y-8"><section><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">{type==="project"?"Case study":type==="event"?"Event overview":"Story"}</p><h2 className="mt-2 text-2xl font-bold">{type==="project"?"Challenge and response":type==="event"?"About this event":"From SIGHT ISIMM"}</h2><p className="mt-4 whitespace-pre-line text-lg leading-8 text-muted-foreground">{description}</p></section>{type==="project"&&<section className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="p-6"><Target className="h-6 w-6 text-primary"/><h2 className="mt-4 font-bold">Community need</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This initiative connects engineering work with an identified community or educational need.</p></CardContent></Card><Card><CardContent className="p-6"><Users className="h-6 w-6 text-primary"/><h2 className="mt-4 font-bold">Implementation</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">The published project record will continue to be updated with milestones, team contributions and measured outcomes.</p></CardContent></Card></section>}</div><aside><Card className="sticky top-28"><CardContent className="space-y-4 p-6"><h2 className="font-bold">At a glance</h2><dl className="space-y-3 text-sm">{value(item,"date")&&<div><dt className="text-muted-foreground">Date</dt><dd className="font-medium">{displayDate(item, false)}</dd></div>}{value(item,"status")&&<div><dt className="text-muted-foreground">Status</dt><dd className="font-medium">{value(item,"status")}</dd></div>}{value(item,"location")&&<div><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{value(item,"location")}</dd></div>}</dl>{externalLink&&<Button asChild className="w-full"><Link href={externalLink} target="_blank" rel="noopener noreferrer">{label}<ExternalLink className="ml-2 h-4 w-4"/></Link></Button>}{vToolsUrl&&<Button asChild variant="outline" className="w-full"><Link href={vToolsUrl} target="_blank" rel="noopener noreferrer">IEEE vTools<ExternalLink className="ml-2 h-4 w-4"/></Link></Button>}</CardContent></Card></aside></div>
    </div>
  </article>
}
