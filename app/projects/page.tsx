"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, ChevronLeft, ChevronRight, Filter, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NewsletterSection } from "@/components/newsletter-section"
import { getProjects } from "@/lib/api"

type ProjectStatus = "Completed" | "In Progress" | "Planned"

interface ProjectItem {
  _id: string
  title: string
  description: string
  date: string
  projectType: string
  customType?: string
  displayType?: string
  imageUrls?: string[]
  imageUrl?: string
  proposalFormUrl?: string
  status: ProjectStatus
  createdAt?: string
  updatedAt?: string
}

function ProjectImageCarousel({ images, title }: { images: string[]; title: string }) {
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

const getStatusClasses = (status: ProjectStatus) => {
  if (status === "Completed") return "bg-emerald-100 text-emerald-800 border-emerald-200"
  if (status === "In Progress") return "bg-amber-100 text-amber-800 border-amber-200"
  return "bg-sky-100 text-sky-800 border-sky-200"
}

const statusLabelForFilter = (status: ProjectStatus) => {
  if (status === "Planned") return "Upcoming"
  return status
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest")

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true)
        const response = await getProjects()
        if (response.success) {
          setProjects(response.data ?? [])
        } else {
          setProjects([])
        }
      } catch (error) {
        console.error(error)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const projectTypes = useMemo(() => {
    const uniqueTypes = new Set<string>()
    projects.forEach((project) => {
      uniqueTypes.add(project.displayType || project.customType || project.projectType)
    })
    return Array.from(uniqueTypes)
  }, [projects])

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filtered = projects.filter((project) => {
      const projectDisplayType = project.displayType || project.customType || project.projectType

      const matchesStatus = statusFilter === "all" ? true : project.status === statusFilter
      const matchesType = typeFilter === "all" ? true : projectDisplayType === typeFilter
      const matchesSearch =
        !normalizedQuery ||
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.description.toLowerCase().includes(normalizedQuery) ||
        projectDisplayType.toLowerCase().includes(normalizedQuery)

      return matchesStatus && matchesType && matchesSearch
    })

    filtered.sort((a, b) => {
      const aTime = new Date(a.date).getTime()
      const bTime = new Date(b.date).getTime()
      return dateSort === "newest" ? bTime - aTime : aTime - bTime
    })

    return filtered
  }, [projects, searchQuery, statusFilter, typeFilter, dateSort])

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/40 via-white to-white">
      <section className="bg-gradient-to-br from-red-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              SIGHT ISIMM <span className="text-red-700">Projects</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Explore our humanitarian technology projects and discover how we transform ideas into community impact.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 border-y bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-center gap-2 text-gray-700">
            <Filter className="h-5 w-5 text-red-700" />
            <h2 className="font-semibold">Filter Projects</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or type"
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Planned">Upcoming</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {projectTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 max-w-xs">
            <Select value={dateSort} onValueChange={(value: "newest" | "oldest") => setDateSort(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Date: Newest First</SelectItem>
                <SelectItem value="oldest">Date: Oldest First</SelectItem>
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
          ) : filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-600">
                No projects match your filters yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const displayType = project.displayType || project.customType || project.projectType
                const gallery =
                  project.imageUrls && project.imageUrls.length > 0
                    ? project.imageUrls
                    : project.imageUrl
                      ? [project.imageUrl]
                      : []

                return (
                  <Card key={project._id} className="border-red-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <ProjectImageCarousel images={gallery} title={project.title} />
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-xl leading-tight">{project.title}</CardTitle>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusClasses(project.status)}`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <CardDescription className="flex items-center gap-2 text-sm text-gray-500 pt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(project.date).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="inline-flex rounded-md bg-red-50 text-red-800 px-3 py-1 text-xs font-medium">
                        {displayType}
                      </div>

                      <p className="text-gray-700 leading-relaxed">{project.description}</p>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status: {statusLabelForFilter(project.status)}</span>
                        {project.proposalFormUrl ? (
                          <Button asChild size="sm" className="bg-red-700 hover:bg-red-800 text-white">
                            <Link href={project.proposalFormUrl} target="_blank" rel="noopener noreferrer">
                              Proposal Form
                            </Link>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            No Form
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <NewsletterSection />
    </div>
  )
}
