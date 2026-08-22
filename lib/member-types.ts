export const MEMBER_STATUSES = ["pending", "active", "rejected", "suspended"] as const
export type MemberStatus = (typeof MEMBER_STATUSES)[number]

export const MEMBER_ROLES = ["member", "project_member", "project_leader", "officer", "admin"] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

export const OFFICER_POSITIONS = [
  "Chair",
  "Vice Chair",
  "Secretary",
  "Treasurer",
  "HR",
  "Webmaster",
  "Project Coordinator",
  "Media Manager",
] as const

export interface PublicMember {
  _id: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  ieeeMemberId: string
  ieeeGrade?: string
  ieeeStatus?: string
  university: string
  department: string
  studyLevel: string
  status: MemberStatus
  role: MemberRole
  officerPosition?: string
  photoUrl?: string
  skills: string[]
  interests: string[]
  technologies: string[]
  sdgs: string[]
  linkedin?: string
  github?: string
  portfolio?: string
  createdAt?: string
  updatedAt?: string
  stats?: {
    eventsAttended: number
    volunteerHours: number
    projects: number
    certificates: number
    badges: number
    achievements: number
    sightPoints: number
  }
}

export function serializeMember(member: Record<string, unknown>): PublicMember {
  return {
    _id: member._id?.toString?.() ?? String(member._id || ""),
    firstName: String(member.firstName || ""),
    middleName: member.middleName ? String(member.middleName) : undefined,
    lastName: String(member.lastName || ""),
    email: String(member.email || ""),
    ieeeMemberId: String(member.ieeeMemberId || ""),
    ieeeGrade: member.ieeeGrade ? String(member.ieeeGrade) : undefined,
    ieeeStatus: member.ieeeStatus ? String(member.ieeeStatus) : undefined,
    university: String(member.university || ""),
    department: String(member.department || ""),
    studyLevel: String(member.studyLevel || ""),
    status: (member.status || "pending") as MemberStatus,
    role: (member.role || "member") as MemberRole,
    officerPosition: member.officerPosition ? String(member.officerPosition) : undefined,
    photoUrl: member.photoUrl ? String(member.photoUrl) : undefined,
    skills: Array.isArray(member.skills) ? member.skills.map(String) : [],
    interests: Array.isArray(member.interests) ? member.interests.map(String) : [],
    technologies: Array.isArray(member.technologies) ? member.technologies.map(String) : [],
    sdgs: Array.isArray(member.sdgs) ? member.sdgs.map(String) : [],
    linkedin: member.linkedin ? String(member.linkedin) : undefined,
    github: member.github ? String(member.github) : undefined,
    portfolio: member.portfolio ? String(member.portfolio) : undefined,
    createdAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : member.createdAt ? String(member.createdAt) : undefined,
    updatedAt: member.updatedAt instanceof Date ? member.updatedAt.toISOString() : member.updatedAt ? String(member.updatedAt) : undefined,
  }
}
