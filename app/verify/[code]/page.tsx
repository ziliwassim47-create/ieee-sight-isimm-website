import type { Metadata } from "next"
import { CheckCircle2, XCircle } from "lucide-react"
import { getDb } from "@/lib/mongodb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Certificate Verification", description: "Verify a certificate issued by IEEE SIGHT ISIMM." }

export const dynamic = "force-dynamic"

type CertificateView = { code: string; title: string; type: string; issuedAt: Date; memberName: string }

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  let certificate: CertificateView | null = null
  try {
    const db = await getDb()
    const item = await db.collection("certificates").aggregate([
      { $match: { code: code.toUpperCase(), status: "issued" } },
      { $lookup: { from: "members", localField: "memberId", foreignField: "_id", as: "member" } },
      { $unwind: "$member" },
      { $project: { code: 1, title: 1, type: 1, issuedAt: 1, memberName: { $concat: ["$member.firstName", " ", "$member.lastName"] } } },
    ]).next()
    certificate = item as CertificateView | null
  } catch {
    certificate = null
  }

  return <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-muted/30 px-4 py-16"><Card className="w-full max-w-xl text-center"><CardHeader>{certificate ? <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" /> : <XCircle className="mx-auto h-16 w-16 text-destructive" />}<CardTitle className="mt-4 text-2xl">{certificate ? "Valid Certificate" : "Certificate Not Found"}</CardTitle></CardHeader><CardContent>{certificate ? <div className="space-y-2"><p className="text-lg font-semibold">{certificate.memberName}</p><p>{certificate.title}</p><p className="text-sm text-muted-foreground">{certificate.type} • Issued {new Date(certificate.issuedAt).toLocaleDateString()}</p><p className="mt-5 rounded-lg bg-muted p-3 font-mono text-sm">{certificate.code}</p><p className="text-xs text-muted-foreground">Issued by IEEE SIGHT ISIMM Student Branch Group</p></div> : <div><p className="text-muted-foreground">The code <span className="font-mono">{code}</span> is invalid, unavailable, or the database is not connected.</p></div>}</CardContent></Card></section>
}
