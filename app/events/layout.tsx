import type { Metadata } from "next"
export const metadata: Metadata = { title: "Events", description: "Upcoming and past IEEE SIGHT ISIMM events, workshops and community activities.", alternates: { canonical: "/events" } }
export default function EventsLayout({ children }: { children: React.ReactNode }) { return children }
