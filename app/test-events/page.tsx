"use client"

import { useEffect, useState } from "react"

interface Event {
  id: number
  title: string
  description: string
  date: string
  location: string
  attendees: number
  images: string[]
  created_at: string
  updated_at: string
}

export default function TestEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Testing API call...')
        const response = await fetch('/api/events')
        console.log('Response status:', response.status)
        
        const data = await response.json()
        console.log('Response data:', data)
        
        if (data.success) {
          setEvents(data.data || [])
        } else {
          setError(data.message || 'Failed to load events')
        }
      } catch (error) {
        console.error('Error:', error)
        setError('Network error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p>Loading events...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Events Test Page</h1>
      
      <div className="mb-4">
        <p className="text-lg">Total events: <strong>{events.length}</strong></p>
      </div>

      {events.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>No events found!</strong> The API returned an empty array.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="border border-gray-300 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
              <p className="text-gray-600 mb-2">{event.description}</p>
              <div className="text-sm text-gray-500">
                <p><strong>Date:</strong> {event.date}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Attendees:</strong> {event.attendees}</p>
                <p><strong>Images:</strong> {event.images ? event.images.length : 0}</p>
                <p><strong>ID:</strong> {event.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
} 