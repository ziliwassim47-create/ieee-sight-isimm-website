// Excom (Executive Committee) types and constants

export const EXCOM_POSITIONS = [
  "Chairman",
  "Chairwoman",
  "Vice Chair",
  "Secretary",
  "Treasurer",
  "Webmaster",
  "HR Manager",
  "Project Coordinator",
  "Other",
] as const

export type ExcomPosition = (typeof EXCOM_POSITIONS)[number]

export interface ExcomMember {
  _id?: string
  mandateId: string
  name: string
  position: ExcomPosition
  customPosition?: string
  email: string
  facebook?: string
  linkedin?: string
  imageUrl?: string
  order?: number
  created_at?: string
  updated_at?: string
}

export interface Mandate {
  _id?: string
  name: string
  startYear: number
  endYear: number
  isCurrent: boolean
  created_at?: string
  updated_at?: string
}
