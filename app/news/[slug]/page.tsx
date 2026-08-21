import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicDetail } from "@/components/public-detail"
import { getPublicContent } from "@/lib/public-content"
export const dynamic = "force-dynamic"
type Props={params:Promise<{slug:string}>}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const item=await getPublicContent("news",slug);return item?{title:item.title,description:String(item.summary||"IEEE SIGHT ISIMM news"),alternates:{canonical:`/news/${slug}`}}: {title:"Article not found"}}
export default async function NewsDetail({params}:Props){const {slug}=await params;const item=await getPublicContent("news",slug);if(!item)notFound();return <PublicDetail item={item} type="news"/>}
