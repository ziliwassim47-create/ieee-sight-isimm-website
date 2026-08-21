import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicDetail } from "@/components/public-detail"
import { getPublicContent } from "@/lib/public-content"
export const dynamic = "force-dynamic"
type Props={params:Promise<{slug:string}>}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const item=await getPublicContent("events",slug);return item?{title:item.title,description:String(item.description||"IEEE SIGHT ISIMM event"),alternates:{canonical:`/events/${slug}`}}: {title:"Event not found"}}
export default async function EventDetail({params}:Props){const {slug}=await params;const item=await getPublicContent("events",slug);if(!item)notFound();return <PublicDetail item={item} type="event"/>}
