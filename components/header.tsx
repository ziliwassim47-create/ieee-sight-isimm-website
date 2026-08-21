"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Leadership Team", href: "/committee" },
    { name: "Events", href: "/events" },
    { name: "Projects", href: "/projects" },
    { name: "News", href: "/news" },
    { name: "Awards", href: "/awards" },
    { name: "SDGs", href: "/sdgs" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-sm border-b border-red-100 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* SIGHT Logo - Links to Home */}
          <Link href="/" className="flex items-center">
            <Logo type="wie" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-red-700 font-medium transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-700 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            ))}
            <Link
              href="https://docs.google.com/forms/d/e/1FAIpQLSdTniKT8Ex2SywG5WxtNNolIkvKwgYA-szdxpXLBAOSl1qqPA/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-800 transition-colors duration-200"
            >
              Join Us
            </Link>
          </nav>

          {/* IEEE ISIMM SB Logo - Links to IEEE ISIMM Website */}
          <Link href="https://isimm.ieee.tn/" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center">
            <Logo type="ieee" />
          </Link>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-red-100">
            <div className="flex flex-col space-y-3 pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-red-700 font-medium transition-colors duration-200 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="https://docs.google.com/forms/d/e/1FAIpQLSdTniKT8Ex2SywG5WxtNNolIkvKwgYA-szdxpXLBAOSl1qqPA/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-700 text-white px-4 py-3 rounded-lg font-semibold text-center hover:bg-red-800 transition-colors duration-200 mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Join Us
              </Link>
            </div>
            <Link href="https://isimm.ieee.tn/" target="_blank" rel="noopener noreferrer" className="flex justify-center mt-4 pt-4 border-t border-red-100">
              <Logo type="ieeeMobile" />
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
