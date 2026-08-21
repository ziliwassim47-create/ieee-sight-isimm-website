import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface EventData {
  title: string
  description: string
  date: string
  location: string
  attendees?: number
  images?: string[]
}

type Context = { params: Promise<{ id: string }> }

export async function DELETE(request: NextRequest, context: Context) {
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
