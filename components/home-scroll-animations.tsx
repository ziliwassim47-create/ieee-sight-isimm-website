"use client"

import { useEffect } from "react"

const selector = ".home-animate-on-scroll"

export function HomeScrollAnimations() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReducedMotion) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => element.classList.add("visible"))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add("visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.1 },
    )

    const observeNewElements = () => {
      document.querySelectorAll<HTMLElement>(`${selector}:not(.visible)`).forEach((element) => observer.observe(element))
    }

    observeNewElements()

    const mutationObserver = new MutationObserver(observeNewElements)
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      observer.disconnect()
    }
  }, [])

  return null
}
