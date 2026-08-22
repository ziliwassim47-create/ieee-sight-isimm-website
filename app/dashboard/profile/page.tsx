import type { Metadata } from "next"
import { MemberProfileForm } from "@/components/member/member-profile-form"

export const metadata: Metadata = { title: "My Profile" }

export default function ProfilePage() {
  return <MemberProfileForm />
}
