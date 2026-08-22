"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Download, FileCheck2, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Certificate = { _id: string; code: string; title: string; type: string; issuedAt?: string; downloadUrl?: string | null }

export function MemberCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    fetch("/api/certificates", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || "Failed to load certificates")
        setCertificates(result.data || [])
        setError("")
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Failed to load certificates"))
      .finally(() => { if (!silent) setLoading(false) })
  }, [])

  useEffect(() => {
    load()
    const refresh = () => load(true)
    const interval = window.setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh) }
  }, [load])

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Certificates</h1><p className="mt-2 text-muted-foreground">View, verify and download certificates issued to your account by the ExCom.</p></div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">{error}</div> : certificates.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate._id} className="overflow-hidden"><div className="h-2 bg-primary" /><CardHeader><FileCheck2 className="mb-3 h-9 w-9 text-primary" /><CardTitle>{certificate.title}</CardTitle><CardDescription>{certificate.type} • {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : "Issued"}</CardDescription></CardHeader><CardContent><p className="rounded-lg bg-muted p-3 font-mono text-xs">{certificate.code}</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline"><Link href={`/verify/${certificate.code}`} target="_blank"><ShieldCheck className="mr-2 h-4 w-4" />Verify</Link></Button>{certificate.downloadUrl ? <Button asChild><a href={certificate.downloadUrl}><Download className="mr-2 h-4 w-4" />Download</a></Button> : <Button disabled><Download className="mr-2 h-4 w-4" />File unavailable</Button>}</div></CardContent></Card>
          ))}
        </div>
      ) : <div className="rounded-xl border border-dashed p-12 text-center"><FileCheck2 className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 font-semibold">No certificates yet</p><p className="mt-1 text-sm text-muted-foreground">Certificates uploaded by the ExCom will appear here.</p></div>}
    </div>
  )
}
