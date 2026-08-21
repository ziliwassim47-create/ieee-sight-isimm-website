import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { GridFSBucket, ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files uploaded' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const bucket = new GridFSBucket(db, { bucketName: 'event-images' })
    const uploadedFiles: { url: string; id: string; filename: string }[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, message: 'Only image files are allowed' },
          { status: 400 }
        )
      }
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, message: 'File size must be less than 10MB' },
          { status: 400 }
        )
      }
      // Read file buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      // Store in GridFS
      const uploadStream = bucket.openUploadStream(file.name, {
        contentType: file.type
      })
      uploadStream.end(buffer)
      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve)
        uploadStream.on('error', reject)
      })
      const id = uploadStream.id.toString()
      uploadedFiles.push({
        url: `/api/upload/${id}`,
        id,
        filename: file.name
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Upload failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 