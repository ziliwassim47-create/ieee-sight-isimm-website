"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, ChevronLeft, ChevronRight, Handshake, Loader2, Megaphone, Pin, Search, Sparkles, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getNews } from "@/lib/api"

interface NewsItem {
  _id: string
  title: string
  summary: string
  date: string
  category:
    | "Announcement"
    | "Opportunity"
    | "Impact Story"
    | "Partnership"
    | "Call for Volunteers"
    | "Event Update"
  imageUrls?: string[]
  imageUrl?: string
  link?: string
  linkLabel?: string
  isPinned?: boolean
  hasDeadline?: boolean
  deadlineDate?: string
  createdAt?: string
  updatedAt?: string
}

function NewsImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const safeImages = images.length > 0 ? images : ["/placeholder.svg"]

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length)
  }

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % safeImages.length)
  }

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
      <Image src={safeImages[currentIndex]} alt={title} fill className="object-cover" />

      {safeImages.length > 1 ? (
        <>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={goPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={goNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      ) : null}
    </div>
  )
}

const categoryStyles: Record<NewsItem["category"], string> = {
  Announcement: "bg-blue-100 text-blue-800 border-blue-200",
  Opportunity: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Impact Story": "bg-violet-100 text-violet-800 border-violet-200",
  Partnership: "bg-amber-100 text-amber-800 border-amber-200",
  "Call for Volunteers": "bg-rose-100 text-rose-800 border-rose-200",
  "Event Update": "bg-sky-100 text-sky-800 border-sky-200",
}

const newsIdeaCards = [
  {
    title: "Opportunities",
    description: "Scholarships, calls for participation, grants, and registrations for SIGHT-related activities.",
    icon: Target,
    chip: "Apply & Participate",
    accent: "from-emerald-100 to-emerald-50",
    iconAccent: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Impact Stories",
    description: "Field results, beneficiary outcomes, and real community impact from your projects.",
    icon: Sparkles,
    chip: "Real Outcomes",
    accent: "from-violet-100 to-violet-50",
    iconAccent: "bg-violet-100 text-violet-700",
  },
  {
    title: "Partnership Updates",
    description: "Collaborations with NGOs, chapters, universities, and ecosystem stakeholders.",
    icon: Handshake,
    chip: "Collaborations",
    accent: "from-amber-100 to-amber-50",
    iconAccent: "bg-amber-100 text-amber-700",
  },
]

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [quickFilter, setQuickFilter] = useState<"all" | "open-opportunities">("all")

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true)
        const response = await getNews()
        if (response.success) setNews(response.data ?? [])
        else setNews([])
      } catch (error) {
        console.error(error)
        setNews([])
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

  const categories = useMemo(() => {
    const unique = new Set<NewsItem["category"]>()
    news.forEach((item) => unique.add(item.category))
    return Array.from(unique)
  }, [news])

  const getDeadlineState = (item: NewsItem) => {
    if (!item.hasDeadline || !item.deadlineDate) return null

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const deadline = new Date(item.deadlineDate)
    const deadlineStart = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())

    return deadlineStart < todayStart ? "closed" : "open"
  }

  const filteredNews = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()

    return news.filter((item) => {
      const deadlineState = getDeadlineState(item)
      const matchesCategory = categoryFilter === "all" ? true : item.category === categoryFilter
      const matchesQuickFilter =
        quickFilter === "all"
          ? true
          : item.category === "Opportunity" && deadlineState === "open"
      const matchesSearch =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.summary.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized)

      return matchesCategory && matchesQuickFilter && matchesSearch
    })
  }, [news, searchQuery, categoryFilter, quickFilter])

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/40 via-white to-white">
      <section className="bg-gradient-to-br from-red-50 to-white py-20 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              SIGHT ISIMM <span className="text-red-700">Newsroom</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Stay updated on what is happening across our humanitarian technology community.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-4">
            {newsIdeaCards.map((idea) => {
              const Icon = idea.icon

              return (
                <Card
                  key={idea.title}
                  className="group border-red-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`h-2 w-full bg-gradient-to-r ${idea.accent}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${idea.iconAccent}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        {idea.chip}
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-3 leading-tight">{idea.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{idea.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-10 border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search by title, summary, or category"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={quickFilter} onValueChange={(value) => setQuickFilter(value as "all" | "open-opportunities")}>
              <SelectTrigger>
                <SelectValue placeholder="Quick filters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All News</SelectItem>
                <SelectItem value="open-opportunities">Open Opportunities</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-red-700" />
            </div>
          ) : filteredNews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-600">
                No news matches your filters yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredNews.map((item) => (
                <Card key={item._id} className="border-red-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <NewsImageCarousel
                    images={item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : item.imageUrl ? [item.imageUrl] : []}
                    title={item.title}
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-xl leading-tight">{item.title}</CardTitle>
                      {item.isPinned ? <Pin className="h-4 w-4 text-red-700 flex-shrink-0" /> : null}
                    </div>
                    <CardDescription className="flex items-center gap-2 text-sm text-gray-500 pt-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${categoryStyles[item.category]}`}
                      >
                        {item.category}
                      </span>
                      {getDeadlineState(item) === "open" ? (
                        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 border-emerald-200">
                          Open
                        </span>
                      ) : null}
                      {getDeadlineState(item) === "closed" ? (
                        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-700 border-gray-300">
                          Closed
                        </span>
                      ) : null}
                    </div>

                    <p className="text-gray-700 leading-relaxed">{item.summary}</p>

                    {item.hasDeadline && item.deadlineDate ? (
                      <p className="text-sm text-gray-600">
                        Deadline: <span className="font-medium">{new Date(item.deadlineDate).toLocaleDateString()}</span>
                      </p>
                    ) : null}

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Megaphone className="h-3.5 w-3.5" />
                        SIGHT ISIMM update
                      </span>

                      {item.link ? (
                        <Button asChild size="sm" className="bg-red-700 hover:bg-red-800 text-white">
                          <Link href={item.link} target="_blank" rel="noopener noreferrer">
                            {item.linkLabel?.trim() || "Learn More"}
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          No Link
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
