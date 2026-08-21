import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { unauthorizedUnlessAdmin } from '@/lib/admin-auth'

type Context = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, context: Context) {
  const unauthorized = unauthorizedUnlessAdmin(request)
  if (unauthorized) return unauthorized
  try {
    const params = await context.params
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ success: false, message: 'Invalid event ID' }, { status: 400 })
    }

    const body = await request.json()
    const update: Record<string, unknown> = { updated_at: new Date() }
    const normalizedVToolsUrl = body.vToolsUrl === undefined ? undefined : String(body.vToolsUrl).trim()
    const normalizedRegistrationLink = body.registrationLink === undefined ? undefined : String(body.registrationLink).trim()
    if (normalizedVToolsUrl && !/^https?:\/\//i.test(normalizedVToolsUrl)) {
      return NextResponse.json({ success: false, message: 'vToolsUrl must be a valid http/https URL' }, { status: 400 })
    }
    if (normalizedRegistrationLink && !/^https?:\/\//i.test(normalizedRegistrationLink)) {
      return NextResponse.json({ success: false, message: 'registrationLink must be a valid http/https URL' }, { status: 400 })
    }
    if (body.eventType !== undefined && !['upcoming', 'previous'].includes(body.eventType)) {
      return NextResponse.json({ success: false, message: 'Invalid event type' }, { status: 400 })
    }

    for (const field of ['title', 'description', 'date', 'location'] as const) {
      if (body[field] !== undefined) {
        const value = String(body[field]).trim()
        if (!value) return NextResponse.json({ success: false, message: `${field} cannot be empty` }, { status: 400 })
        update[field] = value
      }
    }
    if (body.eventType !== undefined) update.eventType = body.eventType
    if (normalizedRegistrationLink !== undefined) update.registrationLink = normalizedRegistrationLink
    if (normalizedVToolsUrl !== undefined) update.vToolsUrl = normalizedVToolsUrl
    if (body.attendees !== undefined) update.attendees = Math.max(0, Number(body.attendees) || 0)
    if (body.images !== undefined) update.images = Array.isArray(body.images) ? body.images.map(String) : []

    const db = await getDb()
    const event = await db.collection('events').findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set: update },
      { returnDocument: 'after' }
    )
    if (!event) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: { ...event, _id: event._id.toString() }, message: 'Event updated successfully' })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const unauthorized = unauthorizedUnlessAdmin(request)
  if (unauthorized) return unauthorized
  try {
    const params = 'then' in context.params ? await context.params : context.params;
    const eventId = params.id;
    if (!ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid event ID' },
        { status: 400 }
      );
    }
    const db = await getDb();
    const result = await db.collection('events').deleteOne({ _id: new ObjectId(eventId) });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
