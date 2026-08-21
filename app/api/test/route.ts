import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  try {
    const db = await getDb()
    // Try to list collections as a test
    const collections = await db.listCollections().toArray()
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connection successful',
      collections: collections.map(c => c.name)
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 