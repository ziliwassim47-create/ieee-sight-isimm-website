import { ExComMemberManager } from "@/components/member/excom-member-manager"

export default async function ExComMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ExComMemberManager memberId={id} />
}
