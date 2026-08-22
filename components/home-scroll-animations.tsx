"use client"

import { useEffect } from "react"

const selector = ".animate-on-scroll"

export function HomeScrollAnimations() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const delayTimers = new Set<number>()

    if (prefersReducedMotion) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => element.classList.add("visible"))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const element = entry.target as HTMLElement
          const revealDelay = Math.max(0, Number(element.dataset.revealDelay) || 0)
          element.style.transitionDelay = `${revealDelay}ms`
          element.classList.add("visible")
          observer.unobserve(element)

          const timer = window.setTimeout(() => {
            element.style.transitionDelay = "0ms"
            delayTimers.delete(timer)
          }, revealDelay + 650)
          delayTimers.add(timer)
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
      delayTimers.forEach((timer) => window.clearTimeout(timer))
      mutationObserver.disconnect()
      observer.disconnect()
    }
  }, [])

  return null
}
