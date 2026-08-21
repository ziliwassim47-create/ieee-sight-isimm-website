import Link from "next/link"
import { Facebook, Instagram, Linkedin, Mail, MapPin, Music2, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=100091680498696&locale=fr_FR", icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/ieee.sight.isimm", icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/ieee-sight-isimm", icon: Linkedin },
  { label: "TikTok", href: "https://www.tiktok.com/@ieee.sight.isimm", icon: Music2 },
  { label: "YouTube", href: "https://www.youtube.com/@ISIMMSIGHTIEEESBGroup", icon: Youtube },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <section className="border-b bg-muted/40 py-16 text-center">
        <div className="container mx-auto px-4">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Contact</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Let’s create impact together</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Reach out about community needs, partnerships, project ideas or volunteering.</p>
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 py-16 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-8">
          <h2 className="text-2xl font-bold">Get in touch</h2>
          <div className="mt-7 space-y-5">
            <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" />Higher Institute of Computer Science and Mathematics, Monastir, Tunisia</p>
            <Link href="mailto:sight-isimm@ieee.tn" className="flex gap-3 text-primary hover:underline"><Mail className="h-5 w-5" />sight-isimm@ieee.tn</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <Button key={label} asChild variant="outline">
                <Link href={href} target="_blank" rel="noopener noreferrer"><Icon className="mr-2 h-4 w-4" />{label}</Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-950 p-8 text-white">
          <h2 className="text-2xl font-bold">Partner with SIGHT ISIMM</h2>
          <p className="mt-4 leading-7 text-slate-300">We welcome collaboration with IEEE entities, schools, NGOs, community organizations and technical partners.</p>
          <Button asChild className="mt-7 bg-red-700 text-white hover:bg-red-800">
            <Link href="mailto:sight-isimm@ieee.tn?subject=Partnership%20with%20IEEE%20SIGHT%20ISIMM">Propose a collaboration</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
