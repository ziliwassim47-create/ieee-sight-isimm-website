import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Linkedin, Mail, MapPin, Music2, Youtube } from "lucide-react"

const explore = [
  ["About", "/about"], ["Projects", "/projects"], ["Events", "/events"], ["Impact", "/impact"],
  ["News", "/news"], ["Awards", "/awards"], ["SDGs", "/sdgs"], ["Partners", "/partners"],
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-100">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link href="/" className="inline-flex" aria-label="IEEE SIGHT ISIMM home">
            <Image src="/logos/sight logo blanc.png" alt="IEEE SIGHT ISIMM" width={337} height={338} className="h-24 w-auto object-contain" />
          </Link>
          <p className="mt-4 max-w-xl leading-relaxed text-slate-300">Engineering technology for humanitarian impact through innovation, collaboration and sustainable community projects.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="https://www.facebook.com/profile.php?id=100091680498696&locale=fr_FR" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer-social"><Facebook className="h-5 w-5" /></Link>
            <Link href="https://www.instagram.com/ieee.sight.isimm" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social"><Instagram className="h-5 w-5" /></Link>
            <Link href="https://www.linkedin.com/company/ieee-sight-isimm" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer-social"><Linkedin className="h-5 w-5" /></Link>
            <Link href="https://www.tiktok.com/@ieee.sight.isimm" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="footer-social"><Music2 className="h-5 w-5" /></Link>
            <Link href="https://www.youtube.com/@ISIMMSIGHTIEEESBGroup" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="footer-social"><Youtube className="h-5 w-5" /></Link>
            <Link href="mailto:sight-isimm@ieee.tn" aria-label="Email" className="footer-social"><Mail className="h-5 w-5" /></Link>
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-white">Explore</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
            {explore.map(([name, href]) => <li key={href}><Link href={href} className="hover:text-red-300">{name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-white">Contact</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />ISIMM, Monastir, Tunisia</p>
            <Link href="mailto:sight-isimm@ieee.tn" className="flex gap-2 hover:text-red-300"><Mail className="h-4 w-4 text-red-400" />sight-isimm@ieee.tn</Link>
            <Link href="/contact" className="inline-block text-red-300 hover:text-red-200">Collaborate with us →</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-6 sm:flex-row">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-400">Part of the IEEE humanitarian technology ecosystem</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <Link href="https://isimm.ieee.tn/" target="_blank" rel="noopener noreferrer" aria-label="IEEE ISIM Monastir Student Branch">
              <Image src="/logos/logo ieee isimm blanc.png" alt="IEEE ISIM Monastir Student Branch" width={428} height={321} className="h-16 w-auto object-contain transition-opacity hover:opacity-80" />
            </Link>
            <Link href="https://sight.ieee.tn/" target="_blank" rel="noopener noreferrer" aria-label="IEEE Tunisia Section SIGHT">
              <Image src="/logos/tunisia section logo blanc.png" alt="IEEE Tunisia Section SIGHT" width={457} height={306} className="h-16 w-auto object-contain transition-opacity hover:opacity-80" />
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} IEEE SIGHT ISIMM. All rights reserved.</p>
          <div className="flex gap-4"><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/contact" className="hover:text-white">Contact</Link><Link href="/admin" className="hover:text-white">Member login</Link></div>
        </div>
      </div>
    </footer>
  )
}
