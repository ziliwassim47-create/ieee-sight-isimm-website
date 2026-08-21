"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Facebook, Mail, Linkedin } from "lucide-react"
import { getMandates, getExcom } from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Mandate {
  _id: string
  name: string
  startYear: number
  endYear: number
  isCurrent: boolean
}

interface ExcomMember {
  _id: string
  mandateId: string
  name: string
  position: string
  customPosition?: string
  displayPosition?: string
  email: string
  facebook?: string
  linkedin?: string
  imageUrl?: string
  order?: number
}

export default function CommitteePage() {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [mandates, setMandates] = useState<Mandate[]>([])
  const [excomMembers, setExcomMembers] = useState<ExcomMember[]>([])
  const [selectedMandateId, setSelectedMandateId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
          }
        })
      },
      { threshold: 0.1 },
    )
    const elements = document.querySelectorAll(".animate-on-scroll")
    elements.forEach((el) => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [excomMembers])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const mandatesRes = await getMandates()
        if (mandatesRes.success && mandatesRes.data?.length > 0) {
          const data = mandatesRes.data as Mandate[]
          setMandates(data)
          setSelectedMandateId((prev) => {
            if (prev) return prev
            const current = data.find((m) => m.isCurrent) ?? data[0]
            return current._id
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedMandateId) return
    const loadExcom = async () => {
      try {
        setLoading(true)
        const res = await getExcom(selectedMandateId)
        if (res.success) setExcomMembers(res.data ?? [])
        else setExcomMembers([])
      } catch (e) {
        console.error(e)
        setExcomMembers([])
      } finally {
        setLoading(false)
      }
    }
    loadExcom()
  }, [selectedMandateId])

  const chairPerson = excomMembers.find(
    (m) =>
      m.position === "Chairman" ||
      m.position === "Chairwoman" ||
      (m.displayPosition && /chair/i.test(m.displayPosition)),
  ) ?? excomMembers[0]

  const getImageSrc = (member: ExcomMember) => {
    if (member.imageUrl) return member.imageUrl
    return "/placeholder.svg"
  }

  const getPositionDisplay = (member: ExcomMember) => {
    return member.displayPosition || member.customPosition || member.position
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Leadership <span className="text-red-700">Team</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Meet the dedicated leaders driving our humanitarian technology mission forward and
              making a difference in the community
            </p>
          </div>
        </div>
      </section>

      {/* Mandate Selector */}
      {mandates.length > 0 && (
        <section className="py-6 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-4">
              <span className="text-sm font-medium text-gray-600">View mandate:</span>
              <Select value={selectedMandateId} onValueChange={setSelectedMandateId}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select mandate" />
                </SelectTrigger>
                <SelectContent>
                  {mandates.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      )}

      {/* Committee Members */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : excomMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No excom members for this mandate yet. Check back soon or contact us.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {excomMembers.map((member) => (
                <div
                  key={member._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden bg-gray-50">
                    <Image
                      src={getImageSrc(member)}
                      alt={member.name}
                      width={300}
                      height={400}
                      className="w-full h-80 object-contain object-center group-hover:scale-105 transition-transform duration-300 p-2"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-red-700/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
                        {member.facebook && (
                          <Link
                            href={member.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors duration-200"
                          >
                            <Facebook className="h-5 w-5 text-white" />
                          </Link>
                        )}
                        <Link
                          href={`mailto:${member.email}`}
                          className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors duration-200"
                        >
                          <Mail className="h-5 w-5 text-white" />
                        </Link>
                        {member.linkedin && (
                          <Link
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors duration-200"
                          >
                            <Linkedin className="h-5 w-5 text-white" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-red-700 transition-colors duration-200">
                      {member.facebook ? (
                        <Link href={member.facebook} target="_blank" rel="noopener noreferrer">
                          {member.name}
                        </Link>
                      ) : (
                        member.name
                      )}
                    </h3>
                    <p className="text-red-700 font-medium mb-4">{getPositionDisplay(member)}</p>
                    <div className="flex justify-center space-x-3">
                      {member.facebook && (
                        <Link
                          href={member.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-red-700 transition-colors duration-200"
                        >
                          <Facebook className="h-5 w-5" />
                        </Link>
                      )}
                      <Link
                        href={`mailto:${member.email}`}
                        className="text-gray-400 hover:text-red-700 transition-colors duration-200"
                      >
                        <Mail className="h-5 w-5" />
                      </Link>
                      {member.linkedin && (
                        <Link
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-red-700 transition-colors duration-200"
                        >
                          <Linkedin className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Leadership Message */}
      {chairPerson && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-on-scroll">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {chairPerson.position === "Chairwoman" ? "Chairwoman's" : "Chairman's"} Message
              </h2>
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <p className="text-lg text-gray-600 mb-6 leading-relaxed italic">
                  &ldquo;Our leadership team is committed to developing innovative technology
                  solutions that address humanitarian challenges. We believe that technology can be a
                  powerful force for good, and together we are building a stronger, more sustainable
                  future for communities worldwide.&rdquo;
                </p>
                <div className="flex items-center justify-center">
                  <Image
                    src={getImageSrc(chairPerson)}
                    alt={chairPerson.name}
                    width={80}
                    height={80}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{chairPerson.name}</p>
                    <p className="text-red-700">
                      {getPositionDisplay(chairPerson)}, SIGHT ISIMM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
