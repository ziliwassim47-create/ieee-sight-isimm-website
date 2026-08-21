import type { Metadata } from "next"
export const metadata: Metadata = { title: "Projects", description: "Explore IEEE SIGHT ISIMM humanitarian technology projects and case studies.", alternates: { canonical: "/projects" } }
export default function ProjectsLayout({ children }: { children: React.ReactNode }) { return children }
