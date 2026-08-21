"use client"

import Link from "next/link"
import { Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NewsletterSectionProps {
  title?: string
  description?: string
  buttonText?: string
  formUrl?: string
}

export function NewsletterSection({
  title = "Project Proposal",
  description = "Have an idea for a humanitarian technology project? Submit your proposal and let&apos;s build impact together.",
  buttonText = "Proposal Form",
  formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfbQL0eh2M4YehEZbGJhtJiI09DJHqVI4AMLTVv4jURHyNCDA/viewform",
}: NewsletterSectionProps) {

  return (
    <section className="bg-gradient-to-r from-red-700 to-red-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Lightbulb className="h-10 w-10 text-red-200" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
          <p className="text-red-100 mb-6">{description}</p>
          <Button asChild className="bg-white text-red-700 hover:bg-gray-100 font-semibold">
            <Link href={formUrl} target="_blank" rel="noopener noreferrer">
              {buttonText}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
