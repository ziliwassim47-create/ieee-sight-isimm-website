import type { MetadataRoute } from "next"
export default function robots(): MetadataRoute.Robots { const base=process.env.NEXT_PUBLIC_SITE_URL || "https://sight-isimm.ieee.tn"; return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/test-events", "/test-upload"] }], sitemap: `${base}/sitemap.xml`, host: base } }
