import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomeLiveSections } from "@/components/home-live-sections"

export const metadata: Metadata = {
  title: "SIGHT ISIMM - humanitarian technology",
  description: "Explore IEEE SIGHT ISIMM projects, events and measurable humanitarian impact in Tunisia.",
  alternates: { canonical: "/" },
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative isolate border-b bg-gradient-to-br from-red-50 via-background to-red-50 py-16 dark:from-slate-950 dark:via-background dark:to-red-950/30 lg:py-24">
        <div className="absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--primary)/.22)_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> IEEE SIGHT ISIMM Student Branch
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-7xl">
              Advancing <span className="text-primary">Humanitarian</span> Technology
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Welcome to the Special Interest Group in Humanitarian Technology (SIGHT) of IEEE ISIMM Student Branch. We are dedicated to developing and applying technology solutions to address humanitarian challenges and improve the quality of life for communities worldwide through innovation, collaboration, and sustainable development.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full"><Link href="/impact">Explore Our Impact <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-full"><Link href="/join">Join SIGHT</Link></Button>
            </div>
          </div>
          <div className="relative isolate mx-auto aspect-[824/463] w-full max-w-[824px] rounded-3xl shadow-2xl">
            <div className="absolute inset-0 z-0 rotate-[6deg] rounded-3xl bg-[#FECACA] dark:bg-red-950" aria-hidden="true" />
            <Image
              src="/logos/sight.png"
              alt="IEEE SIGHT ISIMM — Special Interest Group on Humanitarian Technology"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 90vw"
              className="z-10 rounded-3xl object-contain dark:hidden"
            />
            <Image
              src="/logos/sight logo blanc.png"
              alt="IEEE SIGHT ISIMM — Special Interest Group on Humanitarian Technology"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 90vw"
              className="z-10 hidden scale-[0.84] rounded-3xl object-contain dark:block"
            />
          </div>
        </div>
      </section>

      <HomeLiveSections />

      <section className="border-y bg-slate-950 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-red-300">Build meaningful change</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">Join IEEE SIGHT ISIMM</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Bring your skills, curiosity and compassion to projects designed around real community needs.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full bg-red-700 text-white hover:bg-red-800"><Link href="/join">Become a Member</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-slate-600 bg-transparent text-white hover:bg-slate-800 hover:text-white"><Link href="/contact">Collaborate With Us</Link></Button>
          </div>
        </div>
      </section>
    </div>
  )
}
