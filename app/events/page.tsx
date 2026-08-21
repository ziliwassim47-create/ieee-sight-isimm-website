"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Users, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewsletterSection } from "@/components/newsletter-section"

interface Event {
  _id: string
  title: string
  description: string
  date: string
  location: string
  eventType?: "upcoming" | "previous"
  registrationLink?: string
  attendees: number
  images: string[]
  created_at: string
  updated_at: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/events')
        const data = await response.json()

        if (data.success) {
          setEvents(data.data || [])
        } else {
          setEvents([])
        }
      } catch (error) {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const openLightbox = (event: Event) => {
    setSelectedEvent(event)
    setCurrentImageIndex(0)
    document.body.style.overflow = "hidden"
  }

  const closeLightbox = () => {
    setSelectedEvent(null)
    setCurrentImageIndex(0)
    document.body.style.overflow = "unset"
  }

  const nextImage = () => {
    if (selectedEvent && selectedEvent.images) {
      setCurrentImageIndex((prev) => (prev === selectedEvent.images.length - 1 ? 0 : prev + 1))
    }
  }

  const prevImage = () => {
    if (selectedEvent && selectedEvent.images) {
      setCurrentImageIndex((prev) => (prev === 0 ? selectedEvent.images.length - 1 : prev - 1))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/events?t=' + Date.now())
      const data = await response.json()
      if (data.success) {
        setEvents(data.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => event.eventType === "upcoming")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events])

  const previousEvents = useMemo(() => {
    return [...events]
      .filter((event) => event.eventType !== "upcoming")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [events])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-700" />
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our <span className="text-red-700">Events</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Explore our upcoming opportunities and revisit our previous humanitarian technology events
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Events ({upcomingEvents.length})</h2>
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              size="sm"
            >
              Refresh Events
            </Button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Events</h3>
                <p className="text-gray-600 mb-4">
                  There are currently no upcoming events with registration.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <div
                  key={event._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                    <div className="relative overflow-hidden">
                      <Image
                        src={event.images && event.images.length > 0 ? event.images[0] : "/placeholder.svg"}
                        alt={event.title}
                        width={400}
                        height={250}
                        className="w-full h-48 object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-red-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-red-700 transition-colors duration-200">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-red-700" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-red-700" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-red-700" />
                          {event.attendees} attendees
                        </div>
                      </div>
                      <div className="mt-5">
                        {event.registrationLink ? (
                          <Button asChild className="w-full bg-red-700 hover:bg-red-800 text-white">
                            <Link href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                              Register Now
                            </Link>
                          </Button>
                        ) : (
                          <Button className="w-full" variant="outline" disabled>
                            Registration Soon
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Previous Events */}
      <section className="py-20 bg-gray-50 border-t">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Previous Events ({previousEvents.length})</h2>
            <p className="text-gray-600 mt-1">Browse our past events and photo highlights.</p>
          </div>

          {previousEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No previous events available yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {previousEvents.map((event) => (
                <div
                  key={event._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                  onClick={() => openLightbox(event)}
                >
                  <div className="relative overflow-hidden">
                    <Image
                      src={event.images && event.images.length > 0 ? event.images[0] : "/placeholder.svg"}
                      alt={event.title}
                      width={400}
                      height={250}
                      className="w-full h-48 object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-red-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-red-700">
                        {event.images ? event.images.length : 0} photos
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-red-700 transition-colors duration-200">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-red-700" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-red-700" />
                        {event.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-red-700" />
                        {event.attendees} attendees
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <NewsletterSection
        title="Event Proposal"
        description="Have an event idea for our community? Share your proposal and help us design meaningful activities together."
        buttonText="Event Proposal Form"
        formUrl="https://docs.google.com/forms/d/e/1FAIpQLSfV21OpjokhHqvLNq54QeFZmI8aSF3QW_NvTOUCGiUdQWlq5Q/viewform"
      />

      {/* Lightbox Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-xl overflow-hidden flex flex-col">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-gray-400/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-300/80 transition-colors duration-200"
            >
              <X className="h-6 w-6 text-gray-800" />
            </button>

            {/* Image Navigation */}
            {selectedEvent.images && selectedEvent.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-gray-400/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-300/80 transition-colors duration-200"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-gray-400/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-300/80 transition-colors duration-200"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </>
            )}

            {/* Fixed Image Section */}
            <div className="relative h-96 flex-shrink-0">
              <Image
                src={selectedEvent.images && selectedEvent.images.length > 0 ? selectedEvent.images[currentImageIndex] : "/placeholder.svg"}
                alt={selectedEvent.title}
                fill
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </div>

            {/* Scrollable Content Section */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedEvent.title}</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">{selectedEvent.description}</p>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-red-700" />
                    {formatDate(selectedEvent.date)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-red-700" />
                    {selectedEvent.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-red-700" />
                    {selectedEvent.attendees} attendees
                  </div>
                </div>

                {/* Image Thumbnails */}
                {selectedEvent.images && selectedEvent.images.length > 1 && (
                  <div className="mt-6">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {selectedEvent.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors duration-200 ${
                            index === currentImageIndex ? "border-red-700" : "border-transparent"
                          }`}
                        >
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={`${selectedEvent.title} ${index + 1}`}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
