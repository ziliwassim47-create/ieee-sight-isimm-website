"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Users, Calendar, Award, Loader2 } from "lucide-react"

interface Event {
  _id: string
  title: string
  description: string
  date: string
  location: string
  attendees: number
  images: string[]
  created_at: string
  updated_at: string
}

export default function HomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
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
  }, [])

  // Load recent events from database
  useEffect(() => {
    const loadRecentEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/events')
        const data = await response.json()
        
        if (data.success && data.data) {
          const recent = data.data.slice(0, 3)
          setRecentEvents(recent)
        }
      } catch (error) {
        console.error('Error loading recent events:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadRecentEvents()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 to-white py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Advancing <span className="text-red-700">Humanitarian</span> Technology
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Welcome to the Special Interest Group in Humanitarian Technology (SIGHT) of IEEE ISIMM Student Branch. We are dedicated to
                developing and applying technology solutions to address humanitarian challenges and improve the quality of life
                for communities worldwide through innovation, collaboration, and sustainable development.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-red-700 hover:bg-red-800">
                  <Link href="/about">
                    Learn More <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/events">View Events</Link>
                </Button>
              </div>
            </div>
            <div className="animate-slide-in-right">
              <div className="relative">
                <div className="absolute inset-0 bg-red-200 rounded-3xl transform rotate-6"></div>
                <Image
                  src="/logos/sight_logo.png"
                  alt="SIGHT ISIMM Logo"
                  width={600}
                  height={500}
                  className="relative rounded-3xl shadow-2xl object-contain w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Showcase Section - Creative Design */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-red-50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-100 rounded-full filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Empowering Change Through <span className="text-red-700">Innovation</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're more than just numbers—we're a movement of passionate innovators creating real impact
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Active Members Card */}
            <div className="group relative animate-on-scroll">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300 opacity-10"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-red-100">
                <div className="bg-gradient-to-br from-red-500 to-red-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  A Growing Community
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Passionate minds united by a shared vision of humanitarian innovation
                </p>
                <div className="flex items-center text-red-700 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span>Join our family</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </div>
            </div>

            {/* Projects Completed Card */}
            <div className="group relative animate-on-scroll" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300 opacity-10"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-red-100">
                <div className="bg-gradient-to-br from-red-500 to-red-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Turning Ideas Into Reality
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  From concept to completion—delivering solutions that make a difference
                </p>
                <div className="flex items-center text-red-700 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span>Explore our work</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </div>
            </div>

            {/* Communities Impacted Card */}
            <div className="group relative animate-on-scroll" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300 opacity-10"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-red-100">
                <div className="bg-gradient-to-br from-red-500 to-red-700 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Creating Lasting Impact
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Transforming communities through technology-driven humanitarian solutions
                </p>
                <div className="flex items-center text-red-700 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span>See our impact</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Call-to-Action */}
          <div className="text-center mt-16 animate-on-scroll">
            <p className="text-xl text-gray-700 font-medium mb-6">
              Every project starts with a single idea. What's yours?
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center bg-white px-6 py-3 rounded-full shadow-md">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                <span className="text-gray-700 font-medium">Actively Building</span>
              </div>
              <div className="flex items-center bg-white px-6 py-3 rounded-full shadow-md">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                <span className="text-gray-700 font-medium">Open for Collaboration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Events Preview */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Recent Events</h2>
            <p className="text-xl text-gray-600">Stay updated with our latest activities and achievements</p>
          </div>
          <div className="flex flex-wrap gap-8 justify-center">
            {loading ? (
              // Loading state
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))
            ) : recentEvents.length > 0 ? (
              recentEvents.map((event, index) => (
                <div
                  key={event._id || `event-${index}`}
                  className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={event.images[0] || '/images/placeholder.jpg'}
                      alt={event.title}
                      width={400}
                      height={300}
                      className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-red-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-2 text-sm">
                      {formatDate(event.date)} • {event.location}
                    </p>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              // No events state
              <div className="w-full text-center py-12">
                <p className="text-gray-500 text-lg">No recent events found</p>
              </div>
            )}
          </div>
          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link href="/events">
                View All Events <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
