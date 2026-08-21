import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, HeartHandshake, Lightbulb, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Join Us", description: "Join IEEE SIGHT ISIMM and use your skills for humanitarian impact.", alternates: { canonical: "/join" } }
const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdTniKT8Ex2SywG5WxtNNolIkvKwgYA-szdxpXLBAOSl1qqPA/viewform"

export default function JoinPage() {
  return <div className="min-h-screen"><section className="border-b bg-gradient-to-br from-red-50 to-red-50 py-20 text-center dark:from-slate-950 dark:to-red-950/30"><div className="container mx-auto px-4"><p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Join the community</p><h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold sm:text-6xl">Build technology that matters</h1><p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Learn with peers, contribute to real projects and grow as a humanitarian technology volunteer.</p><Button asChild size="lg" className="mt-8 rounded-full"><Link href={formUrl} target="_blank" rel="noopener noreferrer">Start your application <ArrowRight className="ml-2 h-5 w-5" /></Link></Button></div></section><section className="container mx-auto grid gap-6 px-4 py-16 md:grid-cols-3">{[[Users,"A supportive team","Collaborate with students from technical and creative backgrounds."],[Lightbulb,"Hands-on experience","Turn ideas into responsible solutions around real community needs."],[HeartHandshake,"Meaningful service","Contribute time and skills to measurable, sustainable impact."]].map(([Icon,title,copy]) => {const JoinIcon=Icon as typeof Users; return <div key={title as string} className="rounded-2xl border bg-card p-7 shadow-sm"><JoinIcon className="h-7 w-7 text-primary"/><h2 className="mt-5 text-xl font-bold">{title as string}</h2><p className="mt-2 text-muted-foreground">{copy as string}</p></div>})}</section></div>
}
