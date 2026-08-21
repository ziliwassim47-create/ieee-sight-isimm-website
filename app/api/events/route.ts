import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { unauthorizedUnlessAdmin } from '@/lib/admin-auth'
import { fallbackEvents } from '@/lib/fallback-data'

// GET all events
export async function GET() {
  try {
    const db = await getDb()
    const events = await db.collection('events').find({}).sort({ created_at: -1 }).toArray()
    return NextResponse.json({ 
      success: true, 
      data: events.length ? events : fallbackEvents,
      source: events.length ? 'mongodb' : 'fallback'
    })
  } catch {
    return NextResponse.json({ success: true, data: fallbackEvents, source: 'fallback' })
  }
}

// POST new event
export async function POST(request: NextRequest) {
  const unauthorized = unauthorizedUnlessAdmin(request)
  if (unauthorized) return unauthorized
  try {
    const eventData = await request.json()

    // Validate required fields
    if (!eventData.title || !eventData.description || !eventData.date || !eventData.location) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const eventType = eventData.eventType === 'upcoming' ? 'upcoming' : 'previous'
    const normalizedRegistrationLink = (eventData.registrationLink ?? '').toString().trim()
    const normalizedVToolsUrl = (eventData.vToolsUrl ?? '').toString().trim()
    if (eventType === 'upcoming') {
      if (!normalizedRegistrationLink) {
        return NextResponse.json(
          { success: false, message: 'registrationLink is required for upcoming events' },
          { status: 400 }
        )
      }
      if (!/^https?:\/\//i.test(normalizedRegistrationLink)) {
        return NextResponse.json(
          { success: false, message: 'registrationLink must be a valid http/https URL' },
          { status: 400 }
        )
      }
    }
    if (normalizedVToolsUrl && !/^https?:\/\//i.test(normalizedVToolsUrl)) {
      return NextResponse.json(
        { success: false, message: 'vToolsUrl must be a valid http/https URL' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const now = new Date()
    const event = {
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      location: eventData.location,
      eventType,
      registrationLink: eventType === 'upcoming' ? normalizedRegistrationLink : '',
      vToolsUrl: normalizedVToolsUrl,
      attendees: eventData.attendees || 0,
      images: eventData.images || [],
      created_at: now,
      updated_at: now
    }
    const result = await db.collection('events').insertOne(event)
    return NextResponse.json({ 
      success: true, 
      data: { ...event, _id: result.insertedId },
      message: 'Event created successfully' 
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
