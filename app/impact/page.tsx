import type { Metadata } from "next"
import { ImpactDashboard } from "@/components/impact-dashboard"

export const metadata: Metadata = {
  title: "Impact",
  description: "A transparent view of IEEE SIGHT ISIMM projects, events, participation and Sustainable Development Goal contributions.",
  alternates: { canonical: "/impact" },
}

export default function ImpactPage() {
  return (
    <div className="min-h-screen">
      <section className="border-b bg-gradient-to-br from-red-50 via-background to-red-50 py-16 text-center dark:from-slate-950 dark:to-red-950/30">
        <div className="animate-slide-in-left container mx-auto px-4"><p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Public impact report</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Impact you can follow</h1><p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Live indicators drawn from our published projects and events, paired with the goals that guide our work.</p></div>
      </section>
      <ImpactDashboard />
    </div>
  )
}
