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
import { Plus, Edit, Trash2, Upload, Eye, EyeOff, Loader2, Users, Award, Mail, Download, RefreshCw, Pin, UserCheck, UserX } from "lucide-react"
import Image from "next/image"
import {
  loginAdmin,
  getAdminSession,
  logoutAdmin,
  getEvents,
  createEvent,
  updateEvent,
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
  updateAward,
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
  getAdminAccounts,
  createAdminAccount,
  updateAdminAccount,
  deleteAdminAccount,
  getAdminMembers,
  createAdminMember,
  updateAdminMember,
  deleteAdminMember,
  type ProjectData,
  type EventData,
  type NewsData,
} from "@/lib/api"
import { EXCOM_POSITIONS } from "@/lib/excom"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import type { PublicMember } from "@/lib/member-types"

// Add local Event type for MongoDB
interface Event {
  _id: string
  title: string
  description: string
  date: string
  location: string
  eventType: "upcoming" | "previous"
  registrationLink?: string
  vToolsUrl?: string
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
  fullName?: string
  ieeeMemberId?: string
  source?: "member"
}

interface AdminAccount {
  _id: string
  name: string
  email: string
  active: boolean
  createdAt: string
  updatedAt: string
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
  vToolsUrl?: string
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

const MEMBER_DEPARTMENTS = [
  "Computer Science",
  "Mathematics",
  "Electronics / EEA",
  "Information & Communication Technologies (ICT)",
  "Integrated Preparatory Cycle",
  "Engineering",
  "Master's Program",
] as const

const MEMBER_STUDY_LEVELS = [
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Preparatory Cycle 1",
  "Preparatory Cycle 2",
  "Engineering Cycle 1",
  "Engineering Cycle 2",
  "Engineering Cycle 3",
  "Master 1",
  "Master 2",
  "Graduate / Alumni",
] as const

type PlatformMemberEditForm = {
  firstName: string
  middleName: string
  lastName: string
  email: string
  password: string
  ieeeMemberId: string
  ieeeGrade: string
  ieeeStatus: string
  university: string
  department: string
  studyLevel: string
  photoUrl: string
}

const memberToEditForm = (member: PublicMember): PlatformMemberEditForm => ({
  firstName: member.firstName,
  middleName: member.middleName || "",
  lastName: member.lastName,
  email: member.email,
  password: "",
  ieeeMemberId: member.ieeeMemberId,
  ieeeGrade: member.ieeeGrade || "",
  ieeeStatus: member.ieeeStatus || "",
  university: member.university,
  department: member.department,
  studyLevel: member.studyLevel,
  photoUrl: member.photoUrl || "",
})

export default function AdminPage() {
  const [adminTab, setAdminTab] = useState("events")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [eventVToolsDrafts, setEventVToolsDrafts] = useState<Record<string, string>>({})
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editEventForm, setEditEventForm] = useState<Partial<EventData>>({})
  const [newEvent, setNewEvent] = useState<EventData>({
    title: "",
    description: "",
    date: "",
    location: "",
    eventType: "previous",
    registrationLink: "",
    vToolsUrl: "",
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
  const [editingAwardId, setEditingAwardId] = useState<string | null>(null)
  const [editAwardForm, setEditAwardForm] = useState<Partial<Omit<AwardItem, "_id">>>({})

  // ExCom access accounts synchronized with the member login.
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [newAccount, setNewAccount] = useState({ name: "", email: "", password: "" })
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editAccountForm, setEditAccountForm] = useState({ name: "", email: "", password: "", active: true })

  // Member applications and member roles
  const [members, setMembers] = useState<PublicMember[]>([])
  const [memberStatusFilter, setMemberStatusFilter] = useState("all")
  const [newPlatformMember, setNewPlatformMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    ieeeMemberId: "",
    university: "ISIMM",
    department: "Computer Science",
    studyLevel: "Licence 1",
  })
  const [editingPlatformMemberId, setEditingPlatformMemberId] = useState<string | null>(null)
  const [editPlatformMemberForm, setEditPlatformMemberForm] = useState<PlatformMemberEditForm | null>(null)

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
    vToolsUrl: "",
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

  useEffect(() => {
    getAdminSession()
      .then((response) => setIsAuthenticated(Boolean(response.authenticated)))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setCheckingSession(false))
  }, [])

  // Load events on authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadEvents()
      loadMandates()
      loadAwards()
      loadSubscribers()
      loadProjects()
      loadNews()
      loadAccounts()
      loadMembers()
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
        setEventVToolsDrafts(Object.fromEntries((response.data as Event[]).map((event) => [event._id, event.vToolsUrl || ""])))
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

  const handleLogout = async () => {
    await logoutAdmin().catch(() => null)
    setIsAuthenticated(false)
    setEvents([])
  }

  const loadAccounts = async () => {
    try {
      const res = await getAdminAccounts()
      if (res.success) {
        setAccounts(res.data ?? [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadMembers = async (status = memberStatusFilter) => {
    try {
      const res = await getAdminMembers(status)
      if (res.success) setMembers(res.data ?? [])
    } catch (e) {
      console.error(e)
    }
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

    if (newEvent.vToolsUrl?.trim() && !/^https?:\/\//i.test(newEvent.vToolsUrl.trim())) {
      toast.error("vTools link must start with http:// or https://")
      return
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
          vToolsUrl: "",
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

    if (newProject.vToolsUrl?.trim() && !/^https?:\/\//i.test(newProject.vToolsUrl.trim())) {
      toast.error("vTools link must start with http:// or https://")
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
          vToolsUrl: "",
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
    if (editProjectForm.vToolsUrl?.trim() && !/^https?:\/\//i.test(editProjectForm.vToolsUrl.trim())) {
      toast.error("vTools link must start with http:// or https://")
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

  const handleAwardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, forEdit = false) => {
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
      if (forEdit) {
        setEditAwardForm((prev) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...uploadedUrls] }))
      } else {
        setNewAward((prev) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...uploadedUrls] }))
      }
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
        
        if (isEditing) {
          setEditEventForm((prev) => ({ ...prev, images: [...(prev.images || []), ...uploadedUrls] }))
        } else {
          setNewEvent({
            ...newEvent,
            images: [...(newEvent.images || []), ...uploadedUrls],
          })
        }
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

  const removeEditEventImage = (index: number) => {
    setEditEventForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }))
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

  const removeAwardImage = (index: number, forEdit = false) => {
    if (forEdit) {
      setEditAwardForm((prev) => ({
        ...prev,
        imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
      }))
      return
    }
    setNewAward((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }))
  }

  const handleUpdateEvent = async () => {
    if (!editingEventId) return
    if (!editEventForm.title?.trim() || !editEventForm.description?.trim() || !editEventForm.date || !editEventForm.location?.trim()) {
      toast.error("Please fill in all required event fields")
      return
    }
    if (editEventForm.eventType === "upcoming" && !editEventForm.registrationLink?.trim()) {
      toast.error("Please provide a registration link for upcoming events")
      return
    }
    for (const link of [editEventForm.registrationLink, editEventForm.vToolsUrl]) {
      if (link?.trim() && !/^https?:\/\//i.test(link.trim())) {
        toast.error("Links must start with http:// or https://")
        return
      }
    }

    try {
      setLoading(true)
      const res = await updateEvent(editingEventId, editEventForm)
      if (res.success) {
        setEvents(events.map((event) => event._id === editingEventId ? { ...event, ...res.data } : event))
        setEditingEventId(null)
        setEditEventForm({})
        toast.success("Event updated successfully!")
      } else toast.error(res.message || "Failed to update event")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update event")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAward = async () => {
    if (!editingAwardId || !editAwardForm.title?.trim() || !editAwardForm.year) {
      toast.error("Please fill title and year")
      return
    }
    try {
      setLoading(true)
      const res = await updateAward(editingAwardId, {
        title: editAwardForm.title,
        year: Number(editAwardForm.year),
        description: editAwardForm.description || "",
        imageUrls: editAwardForm.imageUrls || [],
      })
      if (res.success) {
        setAwards(awards.map((award) => award._id === editingAwardId ? { ...award, ...res.data } : award))
        setEditingAwardId(null)
        setEditAwardForm({})
        toast.success("Award updated successfully!")
      } else toast.error(res.message || "Failed to update award")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update award")
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async () => {
    if (!newAccount.name.trim() || !newAccount.email.trim() || newAccount.password.length < 8) {
      toast.error("Enter a name, a valid email, and a password of at least 8 characters")
      return
    }
    try {
      setLoading(true)
      const res = await createAdminAccount(newAccount)
      if (res.success) {
        setAccounts([...accounts, res.data])
        setNewAccount({ name: "", email: "", password: "" })
        toast.success("ExCom account created")
      } else toast.error(res.message || "Failed to create account")
    } catch (e) {
      console.error(e)
      toast.error("Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAccount = async () => {
    if (!editingAccountId || !editAccountForm.name.trim() || !editAccountForm.email.trim()) return
    if (editAccountForm.password && editAccountForm.password.length < 8) {
      toast.error("The new password must contain at least 8 characters")
      return
    }
    try {
      setLoading(true)
      const res = await updateAdminAccount(editingAccountId, editAccountForm)
      if (res.success) {
        setAccounts(accounts.map((account) => account._id === editingAccountId ? res.data : account))
        setEditingAccountId(null)
        toast.success("ExCom account updated")
      } else toast.error(res.message || "Failed to update account")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update account")
    } finally {
      setLoading(false)
    }
  }

  const openDeleteAccountDialog = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete ExCom account",
      description: "This account will no longer have ExCom access. Are you sure?",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setConfirmLoading(true)
          const res = await deleteAdminAccount(id)
          if (res.success) {
            setAccounts(accounts.filter((account) => account._id !== id))
            toast.success("ExCom account deleted")
          } else toast.error(res.message || "Failed to delete account")
        } catch (e) {
          console.error(e)
          toast.error("Failed to delete account")
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  const handleCreatePlatformMember = async () => {
    const memberToCreate = {
      ...newPlatformMember,
      firstName: newPlatformMember.firstName.trim(),
      lastName: newPlatformMember.lastName.trim(),
      email: newPlatformMember.email.trim().toLowerCase(),
      ieeeMemberId: newPlatformMember.ieeeMemberId.trim(),
      university: newPlatformMember.university.trim(),
      department: newPlatformMember.department.trim(),
      studyLevel: newPlatformMember.studyLevel.trim(),
    }
    const requiredFields = [
      ["First name", memberToCreate.firstName],
      ["Last name", memberToCreate.lastName],
      ["Email", memberToCreate.email],
      ["Temporary password", memberToCreate.password],
      ["IEEE Member ID", memberToCreate.ieeeMemberId],
      ["University", memberToCreate.university],
      ["Department", memberToCreate.department],
      ["Study level", memberToCreate.studyLevel],
    ] as const
    const missingFields = requiredFields.filter(([, value]) => !value).map(([label]) => label)

    if (missingFields.length > 0) {
      toast.error(`Complete the following field${missingFields.length > 1 ? "s" : ""}: ${missingFields.join(", ")}.`)
      return
    }
    if (memberToCreate.password.length < 8) {
      toast.error("The password must contain at least 8 characters.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberToCreate.email)) {
      toast.error("Enter a valid member email address.")
      return
    }
    try {
      setLoading(true)
      const res = await createAdminMember(memberToCreate)
      if (res.success) {
        setMembers([res.data, ...members])
        setNewPlatformMember({ firstName: "", lastName: "", email: "", password: "", ieeeMemberId: "", university: "ISIMM", department: "Computer Science", studyLevel: "Licence 1" })
        toast.success("Active member account created")
      } else toast.error(res.message || "Failed to create member account")
    } catch (e) {
      console.error(e)
      toast.error("Failed to create member account")
    } finally {
      setLoading(false)
    }
  }

  const fillTestMember = () => {
    setNewPlatformMember({
      firstName: "Wassim",
      lastName: "Zili",
      email: "ziliwassim47@gmail.com",
      password: "",
      ieeeMemberId: "123456789",
      university: "ISIMM",
      department: "Computer Science",
      studyLevel: "Licence 3",
    })
  }

  const exportMembersCsv = () => {
    const headers = ["Full Name", "Middle Name", "IEEE Member ID", "IEEE Grade", "IEEE Status", "Email", "University", "Department", "Study Level", "Status", "Events Attended", "Volunteer Hours", "Projects", "Certificates", "Badges", "Achievements", "SIGHT Points"]
    const rows = members.map((member) => [
      `${member.firstName} ${member.middleName || ""} ${member.lastName}`.replace(/\s+/g, " ").trim(),
      member.middleName || "",
      member.ieeeMemberId,
      member.ieeeGrade || "",
      member.ieeeStatus || "",
      member.email,
      member.university,
      member.department,
      member.studyLevel,
      member.status,
      member.stats?.eventsAttended || 0,
      member.stats?.volunteerHours || 0,
      member.stats?.projects || 0,
      member.stats?.certificates || 0,
      member.stats?.badges || 0,
      member.stats?.achievements || 0,
      member.stats?.sightPoints || 0,
    ])
    const escapeCell = (value: unknown) => {
      const raw = String(value ?? "")
      const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
      return `"${safe.replace(/"/g, '""')}"`
    }
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n")}`
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `sight-members-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Members CSV exported")
  }

  const handleAdminMemberUpdate = async (id: string, data: { status?: string; role?: string; officerPosition?: string }) => {
    try {
      setLoading(true)
      const res = await updateAdminMember(id, data)
      if (res.success) {
        setMembers(members.map((member) => member._id === id ? { ...member, ...res.data } : member))
        toast.success(data.status === "active" ? "Member approved" : "Member updated")
      } else toast.error(res.message || "Failed to update member")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update member")
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlatformMember = async () => {
    if (!editingPlatformMemberId || !editPlatformMemberForm) return
    const requiredFields = [
      ["First name", editPlatformMemberForm.firstName],
      ["Last name", editPlatformMemberForm.lastName],
      ["Email", editPlatformMemberForm.email],
      ["IEEE Member ID", editPlatformMemberForm.ieeeMemberId],
      ["University", editPlatformMemberForm.university],
      ["Department", editPlatformMemberForm.department],
      ["Study level", editPlatformMemberForm.studyLevel],
    ] as const
    const missingFields = requiredFields.filter(([, value]) => !value.trim()).map(([label]) => label)
    if (missingFields.length) {
      toast.error(`Complete the following field${missingFields.length > 1 ? "s" : ""}: ${missingFields.join(", ")}.`)
      return
    }
    if (editPlatformMemberForm.password && editPlatformMemberForm.password.length < 8) {
      toast.error("The new password must contain at least 8 characters.")
      return
    }
    try {
      setLoading(true)
      const res = await updateAdminMember(editingPlatformMemberId, {
        firstName: editPlatformMemberForm.firstName.trim(),
        middleName: editPlatformMemberForm.middleName.trim(),
        lastName: editPlatformMemberForm.lastName.trim(),
        email: editPlatformMemberForm.email.trim().toLowerCase(),
        password: editPlatformMemberForm.password,
        ieeeMemberId: editPlatformMemberForm.ieeeMemberId.trim(),
        ieeeGrade: editPlatformMemberForm.ieeeGrade.trim(),
        ieeeStatus: editPlatformMemberForm.ieeeStatus.trim(),
        university: editPlatformMemberForm.university.trim(),
        department: editPlatformMemberForm.department.trim(),
        studyLevel: editPlatformMemberForm.studyLevel.trim(),
        photoUrl: editPlatformMemberForm.photoUrl.trim(),
      })
      if (res.success) {
        setMembers(members.map((member) => member._id === editingPlatformMemberId ? { ...member, ...res.data } : member))
        setEditingPlatformMemberId(null)
        setEditPlatformMemberForm(null)
        toast.success(editPlatformMemberForm.password ? "Member information and password updated" : "Member information updated")
      } else {
        toast.error(res.message || "Failed to update member")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to update member")
    } finally {
      setLoading(false)
    }
  }

  const openDeletePlatformMemberDialog = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete member account",
      description: "This permanently removes the member account. Are you sure?",
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setConfirmLoading(true)
          const res = await deleteAdminMember(id)
          if (res.success) {
            setMembers(members.filter((member) => member._id !== id))
            toast.success("Member account deleted")
          } else toast.error(res.message || "Failed to delete member")
        } catch (e) {
          console.error(e)
          toast.error("Failed to delete member")
        } finally {
          setConfirmLoading(false)
        }
      },
    })
  }

  if (checkingSession) {
    return <div className="flex min-h-screen items-center justify-center bg-muted/30"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Checking session" /></div>
  }

  const handleUpdateEventVTools = async (event: Event) => {
    const vToolsUrl = (eventVToolsDrafts[event._id] || "").trim()
    if (vToolsUrl && !/^https?:\/\//i.test(vToolsUrl)) {
      toast.error("vTools link must start with http:// or https://")
      return
    }
    try {
      setLoading(true)
      const response = await updateEvent(event._id, { vToolsUrl })
      if (response.success) {
        setEvents(events.map((item) => item._id === event._id ? { ...item, vToolsUrl } : item))
        toast.success("Event vTools link updated")
      } else {
        toast.error(response.message || "Failed to update event")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to update event")
    } finally {
      setLoading(false)
    }
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

        <Tabs value={adminTab} onValueChange={setAdminTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="events">Manage Events</TabsTrigger>
            <TabsTrigger value="projects">Manage Projects</TabsTrigger>
            <TabsTrigger value="news">Manage News</TabsTrigger>
            <TabsTrigger value="excom">Manage Excom</TabsTrigger>
            <TabsTrigger value="awards">Manage Awards</TabsTrigger>
            <TabsTrigger value="accounts">Manage Accounts</TabsTrigger>
            <TabsTrigger value="members">Manage Members</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Member Account</CardTitle>
                <CardDescription>Only administrators can create accounts. New accounts are active immediately.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>First name *</Label><Input value={newPlatformMember.firstName} onChange={(e) => setNewPlatformMember({ ...newPlatformMember, firstName: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Last name *</Label><Input value={newPlatformMember.lastName} onChange={(e) => setNewPlatformMember({ ...newPlatformMember, lastName: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newPlatformMember.email} onChange={(e) => setNewPlatformMember({ ...newPlatformMember, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Temporary password *</Label><Input type="password" autoComplete="new-password" minLength={8} value={newPlatformMember.password} onChange={(e) => setNewPlatformMember({ ...newPlatformMember, password: e.target.value })} placeholder="At least 8 characters" /></div>
                  <div className="space-y-2"><Label>IEEE Member ID *</Label><Input value={newPlatformMember.ieeeMemberId} onChange={(e) => setNewPlatformMember({ ...newPlatformMember, ieeeMemberId: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>University *</Label>
                    <Select value={newPlatformMember.university === "ISIMM" ? "ISIMM" : "Other institution"} onValueChange={(value) => setNewPlatformMember({ ...newPlatformMember, university: value === "Other institution" ? "" : value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="ISIMM">ISIMM</SelectItem><SelectItem value="Other institution">Other institution</SelectItem></SelectContent>
                    </Select>
                    {newPlatformMember.university !== "ISIMM" && <Input value={newPlatformMember.university} onChange={(e) => setNewPlatformMember({ ...newPlatformMember, university: e.target.value })} placeholder="Institution name" />}
                  </div>
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Select value={(MEMBER_DEPARTMENTS as readonly string[]).includes(newPlatformMember.department) ? newPlatformMember.department : "Other"} onValueChange={(value) => setNewPlatformMember({ ...newPlatformMember, department: value === "Other" ? "" : value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MEMBER_DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}<SelectItem value="Other">Other</SelectItem></SelectContent>
                    </Select>
                    {!(MEMBER_DEPARTMENTS as readonly string[]).includes(newPlatformMember.department) && <Input value={newPlatformMember.department} onChange={(e) => setNewPlatformMember({ ...newPlatformMember, department: e.target.value })} placeholder="Department name" />}
                  </div>
                  <div className="space-y-2">
                    <Label>Study level *</Label>
                    <Select value={(MEMBER_STUDY_LEVELS as readonly string[]).includes(newPlatformMember.studyLevel) ? newPlatformMember.studyLevel : "Other"} onValueChange={(value) => setNewPlatformMember({ ...newPlatformMember, studyLevel: value === "Other" ? "" : value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MEMBER_STUDY_LEVELS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}<SelectItem value="Other">Other</SelectItem></SelectContent>
                    </Select>
                    {!(MEMBER_STUDY_LEVELS as readonly string[]).includes(newPlatformMember.studyLevel) && <Input value={newPlatformMember.studyLevel} onChange={(e) => setNewPlatformMember({ ...newPlatformMember, studyLevel: e.target.value })} placeholder="Study level" />}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleCreatePlatformMember} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Create Active Member
                  </Button>
                  <Button type="button" variant="outline" onClick={fillTestMember}>Fill Test Account</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle>Member Accounts</CardTitle>
                    <CardDescription>Manage access, roles, activity statistics, and member exports.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={memberStatusFilter}
                      onValueChange={(status) => {
                        setMemberStatusFilter(status)
                        loadMembers(status)
                      }}
                    >
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All members</SelectItem>
                        <SelectItem value="active">Active members</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={exportMembersCsv} disabled={!members.length}><Download className="mr-2 h-4 w-4" />Export Members CSV</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {members.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No members found for this filter.</p>
                ) : members.map((member) => (
                  <div key={member._id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold">{member.firstName} {member.middleName ? `${member.middleName} ` : ""}{member.lastName}</p>
                          <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${member.status === "active" ? "border-green-200 bg-green-50 text-green-700" : member.status === "pending" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-gray-50 text-gray-600"}`}>{member.status}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{member.email} • IEEE ID {member.ieeeMemberId}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{member.university} • {member.department} • {member.studyLevel}</p>
                        <p className="mt-1 text-xs text-muted-foreground">IEEE grade: {member.ieeeGrade || "Not provided"} • IEEE status: {member.ieeeStatus || "Not provided"}</p>
                        <p className="mt-2 text-xs font-medium text-muted-foreground">
                          {member.stats?.eventsAttended || 0} events • {member.stats?.volunteerHours || 0} h • {member.stats?.projects || 0} projects • {member.stats?.certificates || 0} certificates • {member.stats?.badges || 0} badges • {member.stats?.achievements || 0} achievements • {member.stats?.sightPoints || 0} points
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPlatformMemberId(member._id)
                            setEditPlatformMemberForm(memberToEditForm(member))
                          }}
                        >
                          <Edit className="mr-1 h-4 w-4" />Edit all information
                        </Button>
                        {member.status !== "active" && <Button size="sm" onClick={() => handleAdminMemberUpdate(member._id, { status: "active" })} disabled={loading}><UserCheck className="mr-1 h-4 w-4" />Approve</Button>}
                        {member.status === "pending" && <Button size="sm" variant="outline" onClick={() => handleAdminMemberUpdate(member._id, { status: "rejected" })} disabled={loading}><UserX className="mr-1 h-4 w-4" />Reject</Button>}
                        {member.status === "active" && <Button size="sm" variant="outline" onClick={() => handleAdminMemberUpdate(member._id, { status: "suspended" })} disabled={loading}>Suspend</Button>}
                        <Button size="sm" variant="destructive" onClick={() => openDeletePlatformMemberDialog(member._id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                      <p><span className="font-semibold text-foreground">Password:</span> securely encrypted — use Edit to reset it</p>
                      <p><span className="font-semibold text-foreground">Photo:</span> {member.photoUrl || "Not provided"}</p>
                    </div>
                    {editingPlatformMemberId === member._id && editPlatformMemberForm && (
                      <div className="mt-4 space-y-4 rounded-xl border border-primary/20 bg-background p-4">
                        <div>
                          <h4 className="font-bold">Edit member account</h4>
                          <p className="text-xs text-muted-foreground">The current password cannot be displayed. Enter a new one only when it must be reset.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2"><Label>First name *</Label><Input value={editPlatformMemberForm.firstName} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, firstName: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Last name *</Label><Input value={editPlatformMemberForm.lastName} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, lastName: e.target.value })} /></div>
                          <div className="space-y-2 sm:col-span-2"><Label>Middle name</Label><Input value={editPlatformMemberForm.middleName} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, middleName: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Email *</Label><Input type="email" value={editPlatformMemberForm.email} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, email: e.target.value })} /></div>
                          <div className="space-y-2"><Label>New password (optional)</Label><Input type="password" minLength={8} autoComplete="new-password" value={editPlatformMemberForm.password} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, password: e.target.value })} placeholder="At least 8 characters" /></div>
                          <div className="space-y-2"><Label>IEEE Member ID *</Label><Input value={editPlatformMemberForm.ieeeMemberId} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, ieeeMemberId: e.target.value })} /></div>
                          <div className="space-y-2"><Label>IEEE Grade</Label><Input value={editPlatformMemberForm.ieeeGrade} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, ieeeGrade: e.target.value })} /></div>
                          <div className="space-y-2"><Label>IEEE Status</Label><Input value={editPlatformMemberForm.ieeeStatus} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, ieeeStatus: e.target.value })} /></div>
                          <div className="space-y-2"><Label>University *</Label><Input value={editPlatformMemberForm.university} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, university: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Department *</Label><Input value={editPlatformMemberForm.department} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, department: e.target.value })} /></div>
                          <div className="space-y-2"><Label>Study level *</Label><Input value={editPlatformMemberForm.studyLevel} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, studyLevel: e.target.value })} /></div>
                          <div className="space-y-2 sm:col-span-2"><Label>Photo URL</Label><Input type="url" value={editPlatformMemberForm.photoUrl} onChange={(e) => setEditPlatformMemberForm({ ...editPlatformMemberForm, photoUrl: e.target.value })} /></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={handleSavePlatformMember} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save member</Button>
                          <Button type="button" variant="outline" onClick={() => { setEditingPlatformMemberId(null); setEditPlatformMemberForm(null) }} disabled={loading}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

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
                          {event.vToolsUrl && <a href={event.vToolsUrl} target="_blank" rel="noopener noreferrer" className="ml-3 text-xs font-semibold text-primary hover:underline">IEEE vTools</a>}
                        </div>
                        <div className="mt-3 flex max-w-xl gap-2">
                          <Input
                            type="url"
                            aria-label={`IEEE vTools link for ${event.title}`}
                            value={eventVToolsDrafts[event._id] ?? event.vToolsUrl ?? ""}
                            onChange={(changeEvent) => setEventVToolsDrafts({ ...eventVToolsDrafts, [event._id]: changeEvent.target.value })}
                            placeholder="https://events.vtools.ieee.org/..."
                          />
                          <Button type="button" variant="outline" size="sm" onClick={() => handleUpdateEventVTools(event)} disabled={loading}>Save vTools</Button>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => {
                            setEditingEventId(event._id)
                            setEditEventForm({
                              title: event.title,
                              description: event.description,
                              date: event.date?.slice(0, 10),
                              location: event.location,
                              eventType: event.eventType || "previous",
                              registrationLink: event.registrationLink || "",
                              vToolsUrl: event.vToolsUrl || "",
                              attendees: event.attendees || 0,
                              images: event.images || [],
                            })
                          }}
                          size="sm"
                          variant="outline"
                          aria-label={`Edit ${event.title}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDeleteEvent(event._id)} size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {editingEventId && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Event</CardTitle>
                  <CardDescription>Update all information for this event.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={editEventForm.title ?? ""} onChange={(e) => setEditEventForm({ ...editEventForm, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea value={editEventForm.description ?? ""} onChange={(e) => setEditEventForm({ ...editEventForm, description: e.target.value })} rows={4} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input type="date" value={editEventForm.date ?? ""} onChange={(e) => setEditEventForm({ ...editEventForm, date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Location *</Label>
                      <Input value={editEventForm.location ?? ""} onChange={(e) => setEditEventForm({ ...editEventForm, location: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select
                        value={editEventForm.eventType ?? "previous"}
                        onValueChange={(value) => setEditEventForm({ ...editEventForm, eventType: value as EventData["eventType"] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="previous">Previous</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Attendees</Label>
                      <Input type="number" min="0" value={editEventForm.attendees ?? 0} onChange={(e) => setEditEventForm({ ...editEventForm, attendees: Number(e.target.value) || 0 })} />
                    </div>
                  </div>
                  {editEventForm.eventType === "upcoming" && (
                    <div className="space-y-2">
                      <Label>Registration Link *</Label>
                      <Input type="url" value={editEventForm.registrationLink ?? ""} onChange={(e) => setEditEventForm({ ...editEventForm, registrationLink: e.target.value })} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>IEEE vTools Link</Label>
                    <Input type="url" value={editEventForm.vToolsUrl ?? ""} onChange={(e) => setEditEventForm({ ...editEventForm, vToolsUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Images</Label>
                    {(editEventForm.images || []).length > 0 && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {(editEventForm.images || []).map((url, index) => (
                          <div key={`${url}-${index}`} className="relative">
                            <Image src={url} alt={`Event image ${index + 1}`} width={160} height={100} className="h-24 w-full rounded object-cover" />
                            <Button size="sm" variant="destructive" className="absolute -right-2 -top-2 h-6 w-6 p-0" onClick={() => removeEditEventImage(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files, true)} disabled={loading} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateEvent} disabled={loading}>Save Changes</Button>
                    <Button variant="outline" onClick={() => { setEditingEventId(null); setEditEventForm({}) }}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {adminTab === "events" && <div>
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
                  <Label htmlFor="eventVToolsUrl">IEEE vTools Link</Label>
                  <Input
                    id="eventVToolsUrl"
                    type="url"
                    value={newEvent.vToolsUrl ?? ""}
                    onChange={(e) => setNewEvent({ ...newEvent, vToolsUrl: e.target.value })}
                    placeholder="https://events.vtools.ieee.org/..."
                  />
                </div>
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
          </div>}

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

                <div className="space-y-2">
                  <Label>IEEE vTools Link</Label>
                  <Input
                    type="url"
                    value={newProject.vToolsUrl ?? ""}
                    onChange={(e) => setNewProject({ ...newProject, vToolsUrl: e.target.value })}
                    placeholder="https://events.vtools.ieee.org/..."
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
                            {project.vToolsUrl && <a href={project.vToolsUrl} target="_blank" rel="noopener noreferrer" className="ml-3 text-xs font-semibold text-primary hover:underline">IEEE vTools</a>}
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
                                vToolsUrl: project.vToolsUrl || "",
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

                  <div className="space-y-2">
                    <Label>IEEE vTools Link</Label>
                    <Input
                      type="url"
                      value={editProjectForm.vToolsUrl ?? ""}
                      onChange={(e) => setEditProjectForm({ ...editProjectForm, vToolsUrl: e.target.value })}
                      placeholder="https://events.vtools.ieee.org/..."
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAwardId(award._id)
                            setEditAwardForm({
                              title: award.title,
                              year: award.year,
                              description: award.description,
                              imageUrls: award.imageUrls?.length ? award.imageUrls : (award.imageUrl ? [award.imageUrl] : []),
                            })
                          }}
                          aria-label={`Edit ${award.title}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openDeleteAwardDialog(award._id)} aria-label={`Delete ${award.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {editingAwardId && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Award</CardTitle>
                  <CardDescription>Update the selected award.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input value={editAwardForm.title ?? ""} onChange={(e) => setEditAwardForm({ ...editAwardForm, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Year *</Label>
                      <Input type="number" value={editAwardForm.year ?? new Date().getFullYear()} onChange={(e) => setEditAwardForm({ ...editAwardForm, year: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={editAwardForm.description ?? ""} onChange={(e) => setEditAwardForm({ ...editAwardForm, description: e.target.value })} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Award Pictures</Label>
                    {(editAwardForm.imageUrls || []).length > 0 && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {(editAwardForm.imageUrls || []).map((url, index) => (
                          <div key={`${url}-${index}`} className="relative">
                            <Image src={url} alt={`Award image ${index + 1}`} width={160} height={100} className="h-24 w-full rounded object-cover" />
                            <Button size="sm" variant="destructive" className="absolute -right-2 -top-2 h-6 w-6 p-0" onClick={() => removeAwardImage(index, true)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Input type="file" multiple accept="image/*" onChange={(e) => handleAwardImageUpload(e, true)} disabled={loading} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateAward} disabled={loading}>Save Changes</Button>
                    <Button variant="outline" onClick={() => { setEditingAwardId(null); setEditAwardForm({}) }}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create ExCom Account</CardTitle>
                <CardDescription>Create an ExCom account that signs in through the member login and manages member activity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} placeholder="ExCom member name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={newAccount.email} onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })} placeholder="admin@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" autoComplete="new-password" value={newAccount.password} onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })} placeholder="At least 8 characters" />
                </div>
                <Button onClick={handleAddAccount} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create ExCom Account
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ExCom Accounts</CardTitle>
                <CardDescription>Modify, activate, deactivate, or delete ExCom access accounts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {accounts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No ExCom accounts.</p>
                ) : accounts.map((account) => (
                  <div key={account._id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                      <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${account.active ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                        {account.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingAccountId(account._id)
                          setEditAccountForm({ name: account.name, email: account.email, password: "", active: account.active })
                        }}
                        aria-label={`Edit ${account.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => openDeleteAccountDialog(account._id)} aria-label={`Delete ${account.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {editingAccountId && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit ExCom Account</CardTitle>
                  <CardDescription>Leave the password empty to keep the current password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input value={editAccountForm.name} onChange={(e) => setEditAccountForm({ ...editAccountForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={editAccountForm.email} onChange={(e) => setEditAccountForm({ ...editAccountForm, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" autoComplete="new-password" value={editAccountForm.password} onChange={(e) => setEditAccountForm({ ...editAccountForm, password: e.target.value })} placeholder="Leave empty to keep the current password" />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={editAccountForm.active} onChange={(e) => setEditAccountForm({ ...editAccountForm, active: e.target.checked })} />
                    Account active
                  </label>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateAccount} disabled={loading}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setEditingAccountId(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
                      This list is synchronized automatically with active member accounts. Export it to CSV and use your email client&apos;s BCC field for event reminders.
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
                      const headers = ["Full Name", "IEEE Member ID", "Email", "Account Created At"]
                      const rows = subscribers.map((subscriber) => [subscriber.fullName || "", subscriber.ieeeMemberId || "", subscriber.email, subscriber.subscribedAt])
                      const escapeCell = (value: unknown) => {
                        const raw = String(value ?? "")
                        const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
                        return `"${safe.replace(/"/g, '""')}"`
                      }
                      const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n")}`
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `sight-member-emails-${new Date().toISOString().slice(0, 10)}.csv`
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
                        <div>
                          <p className="text-sm font-semibold">{s.fullName || "Member"}</p>
                          <p className="font-mono text-xs text-muted-foreground">{s.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">IEEE ID {s.ieeeMemberId || "—"}</span>
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
