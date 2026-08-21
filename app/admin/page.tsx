"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Upload, Eye, EyeOff, Loader2, Users, Award, Mail, Download, RefreshCw, Pin } from "lucide-react"
import Image from "next/image"
import {
  loginAdmin,
  getEvents,
  createEvent,
  deleteEvent,
  uploadImages,
  getMandates,
  createMandate,
  updateMandate,
  getExcom,
  createExcomMember,
  updateExcomMember,
  deleteExcomMember,
  uploadExcomImage,
  getAwards,
  createAward,
  deleteAward,
  getNewsletterSubscribers,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getNews,
  createNews,
  updateNews,
  deleteNews,
  type ProjectData,
  type EventData,
  type NewsData,
} from "@/lib/api"
import { EXCOM_POSITIONS } from "@/lib/excom"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"

// Add local Event type for MongoDB
interface Event {
  _id: string
  title: string
  description: string
  date: string
  location: string
  eventType: "upcoming" | "previous"
  registrationLink?: string
  attendees: number
  images: string[]
  created_at: string
  updated_at: string
}

interface Mandate {
  _id: string
  name: string
  startYear: number
  endYear: number
  isCurrent: boolean
}

interface ExcomMember {
  _id: string
  mandateId: string
  name: string
  position: string
  customPosition?: string
  displayPosition?: string
  email: string
  facebook?: string
  linkedin?: string
  imageUrl?: string
  order?: number
}

interface AwardItem {
  _id: string
  title: string
  year: number
  description: string
  imageUrls?: string[]
  imageUrl?: string
}

interface NewsletterSubscriber {
  _id: string
  email: string
  subscribedAt: string
}

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
  status: "Completed" | "In Progress" | "Planned"
  createdAt?: string
  updatedAt?: string
}

interface NewsItem {
  _id: string
  title: string
  summary: string
  date: string
  category: NewsData["category"]
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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [newEvent, setNewEvent] = useState<EventData>({
    title: "",
    description: "",
    date: "",
    location: "",
    eventType: "previous",
    registrationLink: "",
    attendees: 0,
    images: [],
  })

  // Mandates & Excom state
  const [mandates, setMandates] = useState<Mandate[]>([])
  const [excomMembers, setExcomMembers] = useState<ExcomMember[]>([])
  const [selectedMandateId, setSelectedMandateId] = useState<string>("")
  const [newMandate, setNewMandate] = useState<{ name: string; startYear: number | ""; endYear: number | ""; isCurrent: boolean }>({ name: "", startYear: "", endYear: "", isCurrent: false })
  const [editingMandateId, setEditingMandateId] = useState<string | null>(null)
  const [editMandateForm, setEditMandateForm] = useState<{ name: string; startYear: number | ""; endYear: number | ""; isCurrent: boolean }>({
    name: "",
    startYear: "",
    endYear: "",
    isCurrent: false,
  })
  const [newMember, setNewMember] = useState({
    name: "",
    position: "Chairman" as string,
    customPosition: "",
    email: "",
    facebook: "",
    linkedin: "",
    imageUrl: "",
    order: 0,
  })
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editMemberForm, setEditMemberForm] = useState<Partial<ExcomMember>>({})

  // Awards state
  const [awards, setAwards] = useState<AwardItem[]>([])
  const [newAward, setNewAward] = useState({ title: "", year: new Date().getFullYear(), description: "", imageUrls: [] as string[] })

  // Newsletter subscribers state
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])

  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [newProject, setNewProject] = useState<ProjectData>({
    title: "",
    description: "",
    date: "",
    projectType: "Tech for Good",
    customType: "",
    imageUrls: [],
    proposalFormUrl: "",
    status: "Planned",
  })
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editProjectForm, setEditProjectForm] = useState<Partial<ProjectData>>({})

  // News state
  const [news, setNews] = useState<NewsItem[]>([])
  const [newNews, setNewNews] = useState<NewsData>({
    title: "",
    summary: "",
    date: "",
    category: "Announcement",
    imageUrls: [],
    link: "",
    linkLabel: "",
    isPinned: false,
    hasDeadline: false,
    deadlineDate: "",
  })
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null)
  const [editNewsForm, setEditNewsForm] = useState<Partial<NewsData>>({})

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    variant?: "default" | "destructive"
    onConfirm: () => void | Promise<void>
  }>({ open: false, title: "", onConfirm: () => {} })
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Load events on authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadEvents()
      loadMandates()
      loadAwards()
      loadSubscribers()
      loadProjects()
      loadNews()
    }
  }, [isAuthenticated])

  const loadSubscribers = async () => {
    try {
      const res = await getNewsletterSubscribers()
      if (res.success) setSubscribers(res.data ?? [])
    } catch (e) {
      console.error(e)
    }
  }


  useEffect(() => {
    if (isAuthenticated && selectedMandateId) {
      loadExcom(selectedMandateId)
    }
  }, [isAuthenticated, selectedMandateId])

  const loadMandates = async () => {
    try {
      const res = await getMandates()
      if (res.success) setMandates(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadAwards = async () => {
    try {
      const res = await getAwards()
      if (res.success) setAwards(res.data ?? [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadProjects = async () => {
    try {
      const res = await getProjects()
      if (res.success) setProjects(res.data ?? [])
      else setProjects([])
    } catch (e) {
      console.error(e)
      setProjects([])
    }
  }

  const loadNews = async () => {
    try {
      const res = await getNews()
      if (res.success) setNews(res.data ?? [])
      else setNews([])
    } catch (e) {
      console.error(e)
      setNews([])
    }
  }

  const loadExcom = async (mandateId: string) => {
    try {
      setLoading(true)
      const res = await getExcom(mandateId)
      if (res.success) setExcomMembers(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await getEvents()
      if (response.success) {
        setEvents(response.data)
      } else {
        console.error('Failed to load events:', response.message)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password")
      return
    }

    try {
      setLoading(true)
      const response = await loginAdmin({ email, password })
      
      if (response.success) {
        setIsAuthenticated(true)
        setEmail("")
        setPassword("")
        toast.success("Logged in successfully")
      } else {
        toast.error(response.message || "Login failed")
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setEvents([])
  }

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.description || !newEvent.date || !newEvent.location) {
      toast.error("Please fill in all required fields")
      return
    }

    if (newEvent.eventType === "upcoming") {
      if (!newEvent.registrationLink?.trim()) {
        toast.error("Please provide a registration link for upcoming events")
        return
      }
      if (!/^https?:\/\//i.test(newEvent.registrationLink.trim())) {
        toast.error("Registration link must start with http:// or https://")
        return
      }
    }

    try {
      setLoading(true)
      const response = await createEvent(newEvent)
      
      if (response.success) {
        setEvents([response.data, ...events])
        setNewEvent({
          title: "",
          description: "",
          date: "",
          location: "",
          eventType: "previous",
          registrationLink: "",
          attendees: 0,
          images: [],
        })
        toast.success("Event created successfully!")
      } else {
        toast.error(response.message || "Failed to create event")
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error("Failed to create event. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteEventDialog = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete event",
      description: "Are you sure you want to delete this event?",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setConfirmLoading(true)
          const response = await deleteEvent(id)
          if (response.success) {
            setEvents(events.filter((e) => e._id !== id))
            toast.success("Event deleted successfully!")
          } else {
            toast.error(response.message || "Failed to delete event")
          }
        } catch (error) {
          console.error('Error deleting event:', error)
          toast.error("Failed to delete event. Please try again.")
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  const handleDeleteEvent = (id: string) => openDeleteEventDialog(id)

  const handleAddMandate = async () => {
    const startYear = newMandate.startYear === "" ? undefined : Number(newMandate.startYear)
    const endYear = newMandate.endYear === "" ? undefined : Number(newMandate.endYear)
    if (!newMandate.name || startYear === undefined || endYear === undefined) {
      toast.error("Please fill name, start year, and end year")
      return
    }
    try {
      setLoading(true)
      const res = await createMandate({ name: newMandate.name, startYear, endYear, isCurrent: newMandate.isCurrent })
      if (res.success) {
        setMandates([...mandates, res.data])
        setSelectedMandateId(res.data._id)
        setNewMandate({ name: "", startYear: "", endYear: "", isCurrent: false })
        toast.success("Mandate created successfully!")
      } else toast.error(res.message || "Failed to create mandate")
    } catch (e) {
      console.error(e)
      toast.error("Failed to create mandate")
    } finally {
      setLoading(false)
    }
  }

  const handleStartEditMandate = () => {
    const mandate = mandates.find((m) => m._id === selectedMandateId)
    if (!mandate) return

    setEditingMandateId(mandate._id)
    setEditMandateForm({
      name: mandate.name,
      startYear: mandate.startYear,
      endYear: mandate.endYear,
      isCurrent: Boolean(mandate.isCurrent),
    })
  }

  const handleUpdateMandate = async () => {
    if (!editingMandateId) return

    const startYear = editMandateForm.startYear === "" ? undefined : Number(editMandateForm.startYear)
    const endYear = editMandateForm.endYear === "" ? undefined : Number(editMandateForm.endYear)

    if (!editMandateForm.name.trim() || startYear === undefined || endYear === undefined) {
      toast.error("Please fill name, start year, and end year")
      return
    }

    try {
      setLoading(true)
      const res = await updateMandate(editingMandateId, {
        name: editMandateForm.name.trim(),
        startYear,
        endYear,
        isCurrent: editMandateForm.isCurrent,
      })

      if (res.success) {
        await loadMandates()
        setEditingMandateId(null)
        setEditMandateForm({ name: "", startYear: "", endYear: "", isCurrent: false })
        toast.success("Mandate updated successfully!")
      } else {
        toast.error(res.message || "Failed to update mandate")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to update mandate")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedMandateId || !newMember.name || !newMember.position || !newMember.email) {
      toast.error("Please fill name, position, and email")
      return
    }
    if (newMember.position === "Other" && !newMember.customPosition) {
      toast.error("Please enter custom position when selecting Other")
      return
    }
    try {
      setLoading(true)
      const res = await createExcomMember({
        mandateId: selectedMandateId,
        name: newMember.name,
        position: newMember.position,
        customPosition: newMember.position === "Other" ? newMember.customPosition : undefined,
        email: newMember.email,
        facebook: newMember.facebook,
        linkedin: newMember.linkedin,
        imageUrl: newMember.imageUrl,
        order: newMember.order,
      })
      if (res.success) {
        setExcomMembers([...excomMembers, res.data])
        setNewMember({ name: "", position: "Chairman", customPosition: "", email: "", facebook: "", linkedin: "", imageUrl: "", order: excomMembers.length })
        toast.success("Member added successfully!")
      } else toast.error(res.message || "Failed to add member")
    } catch (e) {
      console.error(e)
      toast.error("Failed to add member")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMember = async () => {
    if (!editingMemberId) return
    try {
      setLoading(true)
      const res = await updateExcomMember(editingMemberId, editMemberForm)
      if (res.success) {
        setExcomMembers(excomMembers.map((m) => (m._id === editingMemberId ? { ...m, ...res.data } : m)))
        setEditingMemberId(null)
        setEditMemberForm({})
        toast.success("Member updated!")
      } else toast.error(res.message || "Failed to update")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteMemberDialog = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete member",
      description: "Are you sure you want to remove this member from the excom?",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setConfirmLoading(true)
          const res = await deleteExcomMember(id)
          if (res.success) {
            setExcomMembers(excomMembers.filter((m) => m._id !== id))
            toast.success("Member deleted!")
          } else toast.error(res.message || "Failed to delete")
        } catch (e) {
          console.error(e)
          toast.error("Failed to delete")
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  const handleDeleteMember = (id: string) => openDeleteMemberDialog(id)

  const handleAddProject = async () => {
    if (!newProject.title || !newProject.description || !newProject.date || !newProject.projectType || !newProject.proposalFormUrl || !newProject.status) {
      toast.error("Please fill all required project fields")
      return
    }

    if (!/^https?:\/\//i.test(newProject.proposalFormUrl.trim())) {
      toast.error("Please provide a valid proposal form URL starting with http:// or https://")
      return
    }

    if (newProject.projectType === "Other" && !newProject.customType?.trim()) {
      toast.error("Please provide a custom type when selecting Other")
      return
    }

    try {
      setLoading(true)
      const res = await createProject(newProject)
      if (res.success) {
        setProjects([res.data, ...projects])
        setNewProject({
          title: "",
          description: "",
          date: "",
          projectType: "Tech for Good",
          customType: "",
          imageUrls: [],
          proposalFormUrl: "",
          status: "Planned",
        })
        toast.success("Project created successfully!")
      } else {
        toast.error(res.message || "Failed to create project")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProject = async () => {
    if (!editingProjectId) return
    if (editProjectForm.projectType === "Other" && !editProjectForm.customType?.trim()) {
      toast.error("Please provide a custom type when selecting Other")
      return
    }
    if (editProjectForm.proposalFormUrl !== undefined && !/^https?:\/\//i.test(editProjectForm.proposalFormUrl.trim())) {
      toast.error("Please provide a valid proposal form URL starting with http:// or https://")
      return
    }

    try {
      setLoading(true)
      const res = await updateProject(editingProjectId, editProjectForm)
      if (res.success) {
        setProjects(projects.map((project) => (project._id === editingProjectId ? { ...project, ...res.data } : project)))
        setEditingProjectId(null)
        setEditProjectForm({})
        toast.success("Project updated successfully!")
      } else {
        toast.error(res.message || "Failed to update project")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to update project")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteProjectDialog = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete project",
      description: "Are you sure you want to delete this project?",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setConfirmLoading(true)
          const res = await deleteProject(id)
          if (res.success) {
            setProjects(projects.filter((project) => project._id !== id))
            toast.success("Project deleted successfully!")
          } else {
            toast.error(res.message || "Failed to delete project")
          }
        } catch (e) {
          console.error(e)
          toast.error("Failed to delete project")
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  const handleAddNews = async () => {
    if (!newNews.title || !newNews.summary || !newNews.date || !newNews.category) {
      toast.error("Please fill all required news fields")
      return
    }

    if (newNews.link?.trim() && !/^https?:\/\//i.test(newNews.link.trim())) {
      toast.error("Please provide a valid link starting with http:// or https://")
      return
    }

    if (newNews.hasDeadline && !newNews.deadlineDate?.trim()) {
      toast.error("Please provide a deadline date when deadline mode is enabled")
      return
    }

    try {
      setLoading(true)
      const res = await createNews(newNews)
      if (res.success) {
        setNews([res.data, ...news])
        setNewNews({
          title: "",
          summary: "",
          date: "",
          category: "Announcement",
          imageUrls: [],
          link: "",
          linkLabel: "",
          isPinned: false,
          hasDeadline: false,
          deadlineDate: "",
        })
        toast.success("News item created successfully!")
      } else {
        toast.error(res.message || "Failed to create news item")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to create news item")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNews = async () => {
    if (!editingNewsId) return

    if (editNewsForm.link !== undefined && editNewsForm.link.trim() && !/^https?:\/\//i.test(editNewsForm.link.trim())) {
      toast.error("Please provide a valid link starting with http:// or https://")
      return
    }

    if (editNewsForm.hasDeadline && !editNewsForm.deadlineDate?.trim()) {
      toast.error("Please provide a deadline date when deadline mode is enabled")
      return
    }

    try {
      setLoading(true)
      const res = await updateNews(editingNewsId, editNewsForm)
      if (res.success) {
        setNews(news.map((item) => (item._id === editingNewsId ? { ...item, ...res.data } : item)))
        setEditingNewsId(null)
        setEditNewsForm({})
        toast.success("News item updated successfully!")
      } else {
        toast.error(res.message || "Failed to update news item")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to update news item")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteNewsDialog = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete news item",
      description: "Are you sure you want to delete this news item?",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setConfirmLoading(true)
          const res = await deleteNews(id)
          if (res.success) {
            setNews(news.filter((item) => item._id !== id))
            toast.success("News item deleted successfully!")
          } else {
            toast.error(res.message || "Failed to delete news item")
          }
        } catch (e) {
          console.error(e)
          toast.error("Failed to delete news item")
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  const handleAddAward = async () => {
    if (!newAward.title || !newAward.year) {
      toast.error("Please fill title and year")
      return
    }
    try {
      setLoading(true)
      const res = await createAward({
        title: newAward.title,
        year: Number(newAward.year),
        description: newAward.description,
        imageUrls: newAward.imageUrls,
      })
      if (res.success) {
        setAwards([res.data, ...awards])
        setNewAward({ title: "", year: new Date().getFullYear(), description: "", imageUrls: [] })
        toast.success("Award added successfully!")
      } else toast.error(res.message || "Failed to add award")
    } catch (e) {
      console.error(e)
      toast.error("Failed to add award")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteAwardDialog = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete award",
      description: "Are you sure you want to delete this award?",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setConfirmLoading(true)
          const res = await deleteAward(id)
          if (res.success) {
            setAwards(awards.filter((a) => a._id !== id))
            toast.success("Award deleted!")
          } else toast.error(res.message || "Failed to delete")
        } catch (e) {
          console.error(e)
          toast.error("Failed to delete")
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  const handleAwardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    try {
      setLoading(true)
      const uploadResponse = await uploadImages(Array.from(files))
      if (!uploadResponse.success) {
        toast.error(uploadResponse.message || "Upload failed")
        return
      }

      const uploadedUrls = (uploadResponse.files || []).map((file: { url: string }) => file.url)
      setNewAward((prev) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...uploadedUrls] }))
      toast.success("Images uploaded")
    } catch (err) {
      console.error(err)
      toast.error("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  const handleExcomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, forEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setLoading(true)
      const res = await uploadExcomImage(file)
      if (res.success) {
        if (forEdit) setEditMemberForm((prev) => ({ ...prev, imageUrl: res.url }))
        else setNewMember({ ...newMember, imageUrl: res.url })
        toast.success("Image uploaded")
      } else toast.error(res.message || "Upload failed")
    } catch (err) {
      console.error(err)
      toast.error("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  const uploadMultipleImages = async (files: FileList | File[] | null | undefined) => {
    if (!files || (Array.isArray(files) ? files.length === 0 : files.length === 0)) return []

    const fileArray = Array.isArray(files) ? files : Array.from(files)
    const uploadResponse = await uploadImages(fileArray)
    if (!uploadResponse.success) {
      throw new Error(uploadResponse.message || "Upload failed")
    }

    return (uploadResponse.files || []).map((file: { url: string }) => file.url)
  }

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, forEdit = false) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setLoading(true)
      const uploadedUrls = await uploadMultipleImages(files)
      if (uploadedUrls.length === 0) {
        toast.error("Upload failed")
        return
      }

      if (forEdit) {
        setEditProjectForm((prev) => {
          const existing = prev.imageUrls || []
          return { ...prev, imageUrls: [...existing, ...uploadedUrls] }
        })
      } else {
        setNewProject((prev) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...uploadedUrls] }))
      }

      toast.success("Images uploaded")
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload image")
    } finally {
      setLoading(false)
    }
  }

  const handleNewsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, forEdit = false) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setLoading(true)
      const uploadedUrls = await uploadMultipleImages(files)
      if (uploadedUrls.length === 0) {
        toast.error("Upload failed")
        return
      }

      if (forEdit) {
        setEditNewsForm((prev) => {
          const existing = prev.imageUrls || []
          return { ...prev, imageUrls: [...existing, ...uploadedUrls] }
        })
      } else {
        setNewNews((prev) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...uploadedUrls] }))
      }

      toast.success("Images uploaded")
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload image")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (files: FileList | null, isEditing = false) => {
    if (!files || files.length === 0) return

    try {
      setLoading(true)
      
      // Convert FileList to Array
      const fileArray = Array.from(files)
      
      // Upload images to server
      const uploadResponse = await uploadImages(fileArray)
      
      if (uploadResponse.success) {
        // Extract URLs from the response
        const uploadedUrls = uploadResponse.files.map((file: { url: string; path: string }) => file.url)
        
        setNewEvent({
          ...newEvent,
          images: [...(newEvent.images || []), ...uploadedUrls],
        })
      } else {
        toast.error('Failed to upload images: ' + uploadResponse.message)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const removeImage = (index: number) => {
    setNewEvent({
      ...newEvent,
      images: (newEvent.images || []).filter((_, i) => i !== index),
    })
  }

  const removeProjectImage = (index: number, forEdit = false) => {
    if (forEdit) {
      setEditProjectForm((prev) => {
        const existing = prev.imageUrls || []
        return { ...prev, imageUrls: existing.filter((_, i) => i !== index) }
      })
      return
    }

    setNewProject((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }))
  }

  const removeNewsImage = (index: number, forEdit = false) => {
    if (forEdit) {
      setEditNewsForm((prev) => {
        const existing = prev.imageUrls || []
        return { ...prev, imageUrls: existing.filter((_, i) => i !== index) }
      })
      return
    }

    setNewNews((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }))
  }

  const removeAwardImage = (index: number) => {
    setNewAward((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }))
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sight-isimm.org"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin password"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="events">Manage Events</TabsTrigger>
            <TabsTrigger value="add-event">Add New Event</TabsTrigger>
            <TabsTrigger value="projects">Manage Projects</TabsTrigger>
            <TabsTrigger value="news">Manage News</TabsTrigger>
            <TabsTrigger value="excom">Manage Excom</TabsTrigger>
            <TabsTrigger value="awards">Manage Awards</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
                <CardDescription>Manage your existing events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event._id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                        <div className="text-sm text-gray-500">
                          <span>
                            {event.date} • {event.location} • {event.attendees} attendees
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex rounded-full border px-2 py-1 text-xs font-medium text-red-700 border-red-200 bg-red-50 capitalize">
                            {event.eventType || "previous"}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleDeleteEvent(event._id)} size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-event">
            <Card>
              <CardHeader>
                <CardTitle>Add New Event</CardTitle>
                <CardDescription>Create a new event for the SIGHT community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter event title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Enter event description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Enter event location"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={newEvent.eventType}
                    onValueChange={(value) =>
                      setNewEvent({
                        ...newEvent,
                        eventType: value as EventData["eventType"],
                        registrationLink: value === "upcoming" ? newEvent.registrationLink : "",
                      })
                    }
                  >
                    <SelectTrigger id="eventType">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="previous">Previous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newEvent.eventType === "upcoming" && (
                  <div className="space-y-2">
                    <Label htmlFor="registrationLink">Registration Link</Label>
                    <Input
                      id="registrationLink"
                      type="url"
                      value={newEvent.registrationLink ?? ""}
                      onChange={(e) => setNewEvent({ ...newEvent, registrationLink: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="attendees">Number of Attendees</Label>
                  <Input
                    id="attendees"
                    type="number"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({ ...newEvent, attendees: Number.parseInt(e.target.value) || 0 })}
                    placeholder="Enter number of attendees"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Images</Label>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {(newEvent.images || []).map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`New event image ${index + 1}`}
                          width={200}
                          height={150}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          onClick={() => removeImage(index)}
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="flex-1"
                      disabled={loading}
                    />
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-red-700" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {loading ? 'Uploading images...' : 'Upload multiple images for your event gallery'}
                  </p>
                </div>
                <Button onClick={handleAddEvent} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Project</CardTitle>
                <CardDescription>
                  Create a project with type, timeline, and status for the Projects page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Title *</Label>
                  <Input
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    placeholder="Enter project title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Describe the project"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project Images (Optional)</Label>
                  {(newProject.imageUrls || []).length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {(newProject.imageUrls || []).map((url, index) => (
                        <div key={`${url}-${index}`} className="relative">
                          <Image src={url} alt={`Project preview ${index + 1}`} width={100} height={100} className="rounded object-cover w-full h-24" />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => removeProjectImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Input type="file" multiple accept="image/*" onChange={(e) => handleProjectImageUpload(e)} disabled={loading} />
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Proposal Form URL *</Label>
                  <Input
                    value={newProject.proposalFormUrl}
                    onChange={(e) => setNewProject({ ...newProject, proposalFormUrl: e.target.value })}
                    placeholder="https://docs.google.com/forms/..."
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={newProject.date}
                      onChange={(e) => setNewProject({ ...newProject, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Project Type *</Label>
                    <Select
                      value={newProject.projectType}
                      onValueChange={(value) => setNewProject({ ...newProject, projectType: value as ProjectData["projectType"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tech for Good">Tech for Good</SelectItem>
                        <SelectItem value="TSYP">TSYP</SelectItem>
                        <SelectItem value="SDC">SDC</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={newProject.status}
                      onValueChange={(value) => setNewProject({ ...newProject, status: value as ProjectData["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newProject.projectType === "Other" && (
                  <div className="space-y-2">
                    <Label>Custom Type *</Label>
                    <Input
                      value={newProject.customType ?? ""}
                      onChange={(e) => setNewProject({ ...newProject, customType: e.target.value })}
                      placeholder="Write your custom project type"
                    />
                  </div>
                )}

                <Button onClick={handleAddProject} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
                <CardDescription>Manage published projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.length === 0 ? (
                    <p className="text-gray-500">No projects added yet.</p>
                  ) : (
                    projects.map((project) => (
                      <div key={project._id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{project.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(project.date).toLocaleDateString()} • {project.displayType || project.customType || project.projectType}
                          </p>
                          <div className="mt-2">
                            <span className="inline-flex rounded-full border px-2 py-1 text-xs font-medium text-red-700 border-red-200 bg-red-50">
                              {project.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProjectId(project._id)
                              setEditProjectForm({
                                title: project.title,
                                description: project.description,
                                date: project.date,
                                projectType: (project.projectType || "Tech for Good") as ProjectData["projectType"],
                                customType: project.customType || "",
                                imageUrls: (project.imageUrls && project.imageUrls.length > 0)
                                  ? project.imageUrls
                                  : (project.imageUrl ? [project.imageUrl] : []),
                                proposalFormUrl: project.proposalFormUrl || "",
                                status: project.status,
                              })
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openDeleteProjectDialog(project._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {editingProjectId && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Project</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Title</Label>
                    <Input
                      value={editProjectForm.title ?? ""}
                      onChange={(e) => setEditProjectForm({ ...editProjectForm, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editProjectForm.description ?? ""}
                      onChange={(e) => setEditProjectForm({ ...editProjectForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Project Images</Label>
                    {(editProjectForm.imageUrls || []).length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {(editProjectForm.imageUrls || []).map((url, index) => (
                          <div key={`${url}-${index}`} className="relative">
                            <Image src={url} alt={`Project preview ${index + 1}`} width={100} height={100} className="rounded object-cover w-full h-24" />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={() => removeProjectImage(index, true)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Input type="file" multiple accept="image/*" onChange={(e) => handleProjectImageUpload(e, true)} disabled={loading} />
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Proposal Form URL</Label>
                    <Input
                      value={editProjectForm.proposalFormUrl ?? ""}
                      onChange={(e) => setEditProjectForm({ ...editProjectForm, proposalFormUrl: e.target.value })}
                      placeholder="https://docs.google.com/forms/..."
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={editProjectForm.date ?? ""}
                        onChange={(e) => setEditProjectForm({ ...editProjectForm, date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={editProjectForm.projectType ?? "Tech for Good"}
                        onValueChange={(value) =>
                          setEditProjectForm({ ...editProjectForm, projectType: value as ProjectData["projectType"] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tech for Good">Tech for Good</SelectItem>
                          <SelectItem value="TSYP">TSYP</SelectItem>
                          <SelectItem value="SDC">SDC</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editProjectForm.status ?? "Planned"}
                        onValueChange={(value) =>
                          setEditProjectForm({ ...editProjectForm, status: value as ProjectData["status"] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planned">Planned</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {editProjectForm.projectType === "Other" && (
                    <div className="space-y-2">
                      <Label>Custom Type</Label>
                      <Input
                        value={editProjectForm.customType ?? ""}
                        onChange={(e) => setEditProjectForm({ ...editProjectForm, customType: e.target.value })}
                        placeholder="Write your custom project type"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProject} disabled={loading}>
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProjectId(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add News Item</CardTitle>
                <CardDescription>
                  Publish announcements, opportunities, impact stories, and calls for volunteers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={newNews.title}
                    onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                    placeholder="e.g., Open Call: Project Lead Volunteers"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Summary *</Label>
                  <Textarea
                    value={newNews.summary}
                    onChange={(e) => setNewNews({ ...newNews, summary: e.target.value })}
                    placeholder="Write a short news summary..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>News Images (Optional)</Label>
                  {(newNews.imageUrls || []).length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {(newNews.imageUrls || []).map((url, index) => (
                        <div key={`${url}-${index}`} className="relative">
                          <Image src={url} alt={`News preview ${index + 1}`} width={100} height={100} className="rounded object-cover w-full h-24" />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => removeNewsImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Input type="file" multiple accept="image/*" onChange={(e) => handleNewsImageUpload(e)} disabled={loading} />
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={newNews.date}
                      onChange={(e) => setNewNews({ ...newNews, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={newNews.category}
                      onValueChange={(value) => setNewNews({ ...newNews, category: value as NewsData["category"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Announcement">Announcement</SelectItem>
                        <SelectItem value="Opportunity">Opportunity</SelectItem>
                        <SelectItem value="Impact Story">Impact Story</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="Call for Volunteers">Call for Volunteers</SelectItem>
                        <SelectItem value="Event Update">Event Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Optional Link</Label>
                    <Input
                      type="url"
                      value={newNews.link ?? ""}
                      onChange={(e) => setNewNews({ ...newNews, link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link Button Text (Optional)</Label>
                    <Input
                      value={newNews.linkLabel ?? ""}
                      onChange={(e) => setNewNews({ ...newNews, linkLabel: e.target.value })}
                      placeholder="e.g., Apply Now"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="deadline-news"
                    type="checkbox"
                    checked={Boolean(newNews.hasDeadline)}
                    onChange={(e) =>
                      setNewNews({
                        ...newNews,
                        hasDeadline: e.target.checked,
                        deadlineDate: e.target.checked ? newNews.deadlineDate : "",
                      })
                    }
                  />
                  <Label htmlFor="deadline-news">This news item has a deadline</Label>
                </div>

                {newNews.hasDeadline && (
                  <div className="space-y-2">
                    <Label>Deadline Date *</Label>
                    <Input
                      type="date"
                      value={newNews.deadlineDate ?? ""}
                      onChange={(e) => setNewNews({ ...newNews, deadlineDate: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    id="pin-news"
                    type="checkbox"
                    checked={Boolean(newNews.isPinned)}
                    onChange={(e) => setNewNews({ ...newNews, isPinned: e.target.checked })}
                  />
                  <Label htmlFor="pin-news">Pin this news item to the top</Label>
                </div>

                <Button onClick={handleAddNews} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add News
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All News</CardTitle>
                <CardDescription>Manage what appears on the News page</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {news.length === 0 ? (
                    <p className="text-gray-500">No news items added yet.</p>
                  ) : (
                    news.map((item) => (
                      <div key={item._id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {item.title}
                            {item.isPinned ? <Pin className="h-4 w-4 text-red-700" /> : null}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.summary}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.date).toLocaleDateString()} • {item.category}
                          </p>
                          {item.hasDeadline && item.deadlineDate ? (
                            <p className="text-xs text-amber-700 mt-1">Deadline: {new Date(item.deadlineDate).toLocaleDateString()}</p>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNewsId(item._id)
                              setEditNewsForm({
                                title: item.title,
                                summary: item.summary,
                                date: item.date,
                                category: item.category,
                                imageUrls: (item.imageUrls && item.imageUrls.length > 0)
                                  ? item.imageUrls
                                  : (item.imageUrl ? [item.imageUrl] : []),
                                link: item.link || "",
                                linkLabel: item.linkLabel || "",
                                isPinned: Boolean(item.isPinned),
                                hasDeadline: Boolean(item.hasDeadline),
                                deadlineDate: item.deadlineDate || "",
                              })
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openDeleteNewsDialog(item._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {editingNewsId && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit News Item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editNewsForm.title ?? ""}
                      onChange={(e) => setEditNewsForm({ ...editNewsForm, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Summary</Label>
                    <Textarea
                      value={editNewsForm.summary ?? ""}
                      onChange={(e) => setEditNewsForm({ ...editNewsForm, summary: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>News Images</Label>
                    {(editNewsForm.imageUrls || []).length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {(editNewsForm.imageUrls || []).map((url, index) => (
                          <div key={`${url}-${index}`} className="relative">
                            <Image src={url} alt={`News preview ${index + 1}`} width={100} height={100} className="rounded object-cover w-full h-24" />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={() => removeNewsImage(index, true)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Input type="file" multiple accept="image/*" onChange={(e) => handleNewsImageUpload(e, true)} disabled={loading} />
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={editNewsForm.date ?? ""}
                        onChange={(e) => setEditNewsForm({ ...editNewsForm, date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={editNewsForm.category ?? "Announcement"}
                        onValueChange={(value) =>
                          setEditNewsForm({ ...editNewsForm, category: value as NewsData["category"] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Announcement">Announcement</SelectItem>
                          <SelectItem value="Opportunity">Opportunity</SelectItem>
                          <SelectItem value="Impact Story">Impact Story</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Call for Volunteers">Call for Volunteers</SelectItem>
                          <SelectItem value="Event Update">Event Update</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Optional Link</Label>
                      <Input
                        value={editNewsForm.link ?? ""}
                        onChange={(e) => setEditNewsForm({ ...editNewsForm, link: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Link Button Text</Label>
                      <Input
                        value={editNewsForm.linkLabel ?? ""}
                        onChange={(e) => setEditNewsForm({ ...editNewsForm, linkLabel: e.target.value })}
                        placeholder="e.g., Register"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="edit-deadline-news"
                      type="checkbox"
                      checked={Boolean(editNewsForm.hasDeadline)}
                      onChange={(e) =>
                        setEditNewsForm({
                          ...editNewsForm,
                          hasDeadline: e.target.checked,
                          deadlineDate: e.target.checked ? editNewsForm.deadlineDate : "",
                        })
                      }
                    />
                    <Label htmlFor="edit-deadline-news">This news item has a deadline</Label>
                  </div>

                  {editNewsForm.hasDeadline && (
                    <div className="space-y-2">
                      <Label>Deadline Date</Label>
                      <Input
                        type="date"
                        value={editNewsForm.deadlineDate ?? ""}
                        onChange={(e) => setEditNewsForm({ ...editNewsForm, deadlineDate: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      id="edit-pin-news"
                      type="checkbox"
                      checked={Boolean(editNewsForm.isPinned)}
                      onChange={(e) => setEditNewsForm({ ...editNewsForm, isPinned: e.target.checked })}
                    />
                    <Label htmlFor="edit-pin-news">Pin this news item</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleUpdateNews} disabled={loading}>
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditingNewsId(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="excom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Mandate</CardTitle>
                <CardDescription>Choose the mandate when adding or viewing excom members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mandates.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No mandates yet. Add a new mandate below.
                  </p>
                ) : (
                  <Select value={selectedMandateId} onValueChange={(v) => setSelectedMandateId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mandate" />
                    </SelectTrigger>
                    <SelectContent>
                      {mandates.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.name} ({m.startYear}-{m.endYear}) {m.isCurrent && "★ Current"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Add new mandate</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Input
                      placeholder="e.g., 2024-2025"
                      value={newMandate.name}
                      onChange={(e) => setNewMandate({ ...newMandate, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Start year"
                      value={newMandate.startYear === "" ? "" : newMandate.startYear}
                      onChange={(e) => setNewMandate({ ...newMandate, startYear: e.target.value === "" ? "" : Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      placeholder="End year"
                      value={newMandate.endYear === "" ? "" : newMandate.endYear}
                      onChange={(e) => setNewMandate({ ...newMandate, endYear: e.target.value === "" ? "" : Number(e.target.value) })}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mandate-current"
                        checked={newMandate.isCurrent}
                        onChange={(e) => setNewMandate({ ...newMandate, isCurrent: e.target.checked })}
                      />
                      <Label htmlFor="mandate-current" className="text-sm">Current</Label>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={handleAddMandate}
                    disabled={loading || !newMandate.name}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add mandate
                  </Button>
                </div>

                {selectedMandateId ? (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Edit selected mandate</p>
                      {!editingMandateId ? (
                        <Button size="sm" variant="outline" onClick={handleStartEditMandate} disabled={loading}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit mandate
                        </Button>
                      ) : null}
                    </div>

                    {editingMandateId ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <Input
                            placeholder="Mandate name"
                            value={editMandateForm.name}
                            onChange={(e) => setEditMandateForm({ ...editMandateForm, name: e.target.value })}
                          />
                          <Input
                            type="number"
                            placeholder="Start year"
                            value={editMandateForm.startYear === "" ? "" : editMandateForm.startYear}
                            onChange={(e) => setEditMandateForm({ ...editMandateForm, startYear: e.target.value === "" ? "" : Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            placeholder="End year"
                            value={editMandateForm.endYear === "" ? "" : editMandateForm.endYear}
                            onChange={(e) => setEditMandateForm({ ...editMandateForm, endYear: e.target.value === "" ? "" : Number(e.target.value) })}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="edit-mandate-current"
                              checked={editMandateForm.isCurrent}
                              onChange={(e) => setEditMandateForm({ ...editMandateForm, isCurrent: e.target.checked })}
                            />
                            <Label htmlFor="edit-mandate-current" className="text-sm">Current</Label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateMandate} disabled={loading || !editMandateForm.name.trim()}>
                            Save mandate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMandateId(null)
                              setEditMandateForm({ name: "", startYear: "", endYear: "", isCurrent: false })
                            }}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {selectedMandateId && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Add Excom Member</CardTitle>
                    <CardDescription>Add a new member to the selected mandate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={newMember.email}
                          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                          placeholder="john@ieee.org"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Position *</Label>
                      <Select value={newMember.position} onValueChange={(v) => setNewMember({ ...newMember, position: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXCOM_POSITIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {newMember.position === "Other" && (
                      <div className="space-y-2">
                        <Label>Custom Position *</Label>
                        <Input
                          value={newMember.customPosition}
                          onChange={(e) => setNewMember({ ...newMember, customPosition: e.target.value })}
                          placeholder="e.g., PR Manager"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Facebook URL</Label>
                        <Input
                          value={newMember.facebook}
                          onChange={(e) => setNewMember({ ...newMember, facebook: e.target.value })}
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>LinkedIn URL</Label>
                        <Input
                          value={newMember.linkedin}
                          onChange={(e) => setNewMember({ ...newMember, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        {newMember.imageUrl ? (
                          <div className="relative">
                            <Image src={newMember.imageUrl} alt="Preview" width={80} height={80} className="rounded object-cover" />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={() => setNewMember({ ...newMember, imageUrl: "" })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleExcomImageUpload}
                            disabled={loading}
                          />
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Display Order (lower = first)</Label>
                      <Input
                        type="number"
                        value={newMember.order}
                        onChange={(e) => setNewMember({ ...newMember, order: Number(e.target.value) })}
                      />
                    </div>
                    <Button onClick={handleAddMember} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Excom Members</CardTitle>
                    <CardDescription>Members for this mandate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {excomMembers.map((member) => (
                        <div key={member._id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {member.imageUrl ? (
                              <Image src={member.imageUrl} alt={member.name} width={48} height={48} className="rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold">{member.name}</p>
                              <p className="text-sm text-red-700">
                                {member.displayPosition || member.customPosition || member.position}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMemberId(member._id)
                                setEditMemberForm({
                                  name: member.name,
                                  position: member.position,
                                  customPosition: member.customPosition,
                                  email: member.email,
                                  facebook: member.facebook,
                                  linkedin: member.linkedin,
                                  imageUrl: member.imageUrl,
                                })
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteMember(member._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {editingMemberId && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Edit Member</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={editMemberForm.name ?? ""}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={editMemberForm.email ?? ""}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Select
                          value={editMemberForm.position ?? ""}
                          onValueChange={(v) => setEditMemberForm({ ...editMemberForm, position: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EXCOM_POSITIONS.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {editMemberForm.position === "Other" && (
                        <div className="space-y-2">
                          <Label>Custom Position</Label>
                          <Input
                            value={editMemberForm.customPosition ?? ""}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, customPosition: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Facebook</Label>
                          <Input
                            value={editMemberForm.facebook ?? ""}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, facebook: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>LinkedIn</Label>
                          <Input
                            value={editMemberForm.linkedin ?? ""}
                            onChange={(e) => setEditMemberForm({ ...editMemberForm, linkedin: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <div className="flex items-center gap-4">
                          {editMemberForm.imageUrl ? (
                            <div className="relative">
                              <Image src={editMemberForm.imageUrl} alt="Preview" width={80} height={80} className="rounded object-cover" />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                onClick={() => setEditMemberForm({ ...editMemberForm, imageUrl: "" })}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : null}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleExcomImageUpload(e, true)}
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateMember} disabled={loading}>
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditingMemberId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="awards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Award</CardTitle>
                <CardDescription>Add awards won by IEEE SIGHT ISIMM</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={newAward.title}
                      onChange={(e) => setNewAward({ ...newAward, title: e.target.value })}
                      placeholder="e.g., Best SIGHT Creative April 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year *</Label>
                    <Input
                      type="number"
                      value={newAward.year}
                      onChange={(e) => setNewAward({ ...newAward, year: Number(e.target.value) })}
                      placeholder="2025"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newAward.description}
                    onChange={(e) => setNewAward({ ...newAward, description: e.target.value })}
                    placeholder="Brief description of the award..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Award Pictures</Label>
                  {(newAward.imageUrls || []).length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {(newAward.imageUrls || []).map((url, index) => (
                        <div key={`${url}-${index}`} className="relative">
                          <Image src={url} alt={`Award preview ${index + 1}`} width={100} height={100} className="rounded object-cover w-full h-24" />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => removeAwardImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleAwardImageUpload}
                      disabled={loading}
                    />
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </div>
                </div>
                <Button onClick={handleAddAward} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Award
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>All Awards</CardTitle>
                <CardDescription>Awards displayed on the Awards page</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {awards.map((award) => (
                    <div key={award._id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {(award.imageUrls?.[0] || award.imageUrl) ? (
                          <Image src={award.imageUrls?.[0] || award.imageUrl || "/placeholder.svg"} alt={award.title} width={60} height={60} className="rounded object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center p-4">
                            <Award className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{award.title}</p>
                          <p className="text-sm text-red-700">{award.year}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => openDeleteAwardDialog(award._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Newsletter Subscribers
                    </CardTitle>
                    <CardDescription>
                      Export this list to CSV to send event reminders. Use your email client&apos;s BCC field with the exported emails.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await getNewsletterSubscribers()
                        if (res.success) setSubscribers(res.data ?? [])
                        toast.success("List refreshed")
                      } catch (e) {
                        toast.error("Failed to refresh")
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const headers = ["Email", "Subscribed At"]
                      const rows = subscribers.map((s) => [s.email, s.subscribedAt])
                      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n")
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                      toast.success("CSV exported successfully!")
                    }}
                    disabled={subscribers.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {subscribers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No subscribers yet.</p>
                  ) : (
                    subscribers.map((s) => (
                      <div key={s._id} className="flex items-center justify-between border rounded-lg px-4 py-2">
                        <span className="font-mono text-sm">{s.email}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(s.subscribedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          setConfirmDialog((prev) => ({ ...prev, open }))
          if (!open) setConfirmLoading(false)
        }}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        loading={confirmLoading}
      />
    </div>
  )
}
