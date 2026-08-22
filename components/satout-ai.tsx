"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, Loader2, Send, Sparkles, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ChatLink = { label: string; href: string }
type Message = { id: number; role: "assistant" | "user"; text: string; links?: ChatLink[] }

const welcomeMessage: Message = {
  id: 1,
  role: "assistant",
  text: "Hi! I’m Satout, your IEEE SIGHT ISIMM Assistant. I’m here to help you explore our projects, events, opportunities, and impact. How can I help you today?",
}

const quickQuestions = ["Upcoming events", "Our projects", "Our impact", "How can I join?"]
const hiddenRoutes = ["/admin", "/dashboard", "/login", "/forgot-password", "/verify"]

export function SatoutAI() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([welcomeMessage])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const hidden = hiddenRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  const send = async (question: string) => {
    const text = question.trim()
    if (!text || loading) return
    const userMessage: Message = { id: Date.now(), role: "user", text }
    setMessages((current) => [...current, userMessage])
    setInput("")
    setLoading(true)
    const controller = new AbortController()
    requestRef.current = controller
    try {
      const response = await fetch("/api/satout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Satout is unavailable")
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: result.answer, links: result.links || [] }])
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: "I’m having trouble connecting right now. Please try again or contact us at sight-isimm@ieee.tn." }])
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setLoading(false)
      }
    }
  }

  const resetConversation = () => {
    requestRef.current?.abort()
    requestRef.current = null
    setMessages([welcomeMessage])
    setInput("")
    setLoading(false)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send(input)
  }

  if (hidden) return null

  return <div className="fixed bottom-5 right-4 z-[9999] isolate sm:bottom-7 sm:right-7">
    {open && <section role="dialog" aria-label="Chat with Satout AI" className="absolute bottom-[5.75rem] right-0 z-[10000] flex h-[min(38rem,calc(100vh-9rem))] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-black/25">
      <header className="flex items-center gap-3 bg-gradient-to-r from-red-800 to-red-700 px-4 py-3 text-white">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white"><Image src="/images/satout-ai.gif" alt="Satout AI mascot" fill sizes="48px" unoptimized className="object-cover object-center" /></div>
        <div className="min-w-0 flex-1"><h2 className="flex items-center gap-1.5 font-bold">Satout AI <Sparkles className="h-4 w-4 text-amber-300" /></h2><p className="text-xs text-red-100">IEEE SIGHT ISIMM Assistant</p></div>
        <Button type="button" variant="ghost" size="icon" onClick={resetConversation} className="text-white hover:bg-white/15 hover:text-white" aria-label="Start a new conversation" title="New conversation"><Trash2 className="h-5 w-5" /></Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-white hover:bg-white/15 hover:text-white" aria-label="Close Satout AI"><X className="h-5 w-5" /></Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4" aria-live="polite">
        {messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-background text-foreground"}`}><p className="whitespace-pre-line leading-relaxed">{message.text}</p>{message.links?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.links.map((link) => <Button key={`${message.id}-${link.href}`} asChild size="sm" variant="outline" className="h-auto min-h-8 whitespace-normal text-left text-xs"><Link href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined}>{link.label}<ExternalLink className="ml-1.5 h-3 w-3" /></Link></Button>)}</div> : null}</div></div>)}
        {loading && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border bg-background px-4 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Satout is thinking…</div></div>}
        <div ref={endRef} />
      </div>

      {messages.length === 1 && <div className="flex gap-2 overflow-x-auto border-t bg-background px-3 py-2">{quickQuestions.map((question) => <button key={question} type="button" onClick={() => send(question)} className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:bg-primary/5 hover:text-primary">{question}</button>)}</div>}

      <form onSubmit={submit} className="flex gap-2 border-t bg-background p-3"><Input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} maxLength={500} placeholder="Ask Satout a question…" aria-label="Message for Satout AI" disabled={loading} /><Button type="submit" size="icon" disabled={!input.trim() || loading} aria-label="Send message"><Send className="h-4 w-4" /></Button></form>
      <p className="border-t bg-muted/30 px-3 py-1.5 text-center text-[10px] text-muted-foreground">Satout uses official SIGHT ISIMM website information.</p>
    </section>}

    <button type="button" onClick={() => setOpen(!open)} className={`group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 bg-white shadow-xl shadow-black/25 transition duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${open ? "border-primary" : "border-white dark:border-slate-700"}`} aria-label={open ? "Close Satout AI" : "Open Satout AI"} aria-expanded={open}>
      <Image src="/images/satout-ai.gif" alt="Satout AI" fill sizes="80px" unoptimized className="object-cover object-center transition-transform duration-300 group-hover:scale-110" priority />
      {!open && <span className="absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-slate-700" aria-hidden="true" />}
    </button>
  </div>
}
