"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Events", href: "/events" },
  { name: "Impact", href: "/impact" },
  { name: "News", href: "/news" },
  { name: "Awards", href: "/awards" },
  { name: "SDGs", href: "/sdgs" },
  { name: "Our Team", href: "/team" },
]

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => setIsMenuOpen(false), [pathname])
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <header className="fixed inset-x-0 top-0 z-[100] border-b border-border/70 bg-background/90 shadow-sm backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center" aria-label="IEEE SIGHT ISIMM home">
          <Logo type="wie" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(item.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild className="hidden rounded-full sm:inline-flex"><Link href="/join">Join Us</Link></Button>
          <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMenuOpen((open) => !open)} aria-expanded={isMenuOpen} aria-controls="mobile-navigation" aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <nav id="mobile-navigation" className="border-t border-border bg-background px-4 py-4 lg:hidden" aria-label="Mobile navigation">
          <div className="container mx-auto grid gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className={`rounded-lg px-4 py-3 font-medium ${active(item.href) ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>{item.name}</Link>
            ))}
            <Button asChild className="mt-2 sm:hidden"><Link href="/join">Join Us</Link></Button>
          </div>
        </nav>
      )}
    </header>
  )
}
