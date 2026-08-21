"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { uploadImages } from "@/lib/api"
import { Loader2, Upload } from "lucide-react"

export default function TestUploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files first')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await uploadImages(files)
      
      if (response.success) {
        setUploadedUrls(response.files)
        setFiles([])
      } else {
        setError(response.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Image Upload Test</h1>
      
      <div className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Images</label>
          <Input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        {files.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Selected files: {files.length}
            </p>
            <ul className="text-sm text-gray-500">
              {files.map((file, index) => (
                <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
              ))}
            </ul>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={files.length === 0 || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </>
          )}
        </Button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {uploadedUrls.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Uploaded Images:</h3>
            <div className="space-y-2">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="border rounded p-2">
                  <p className="text-sm font-mono">{url}</p>
                  <img 
                    src={url} 
                    alt={`Uploaded ${index + 1}`}
                    className="w-32 h-24 object-cover rounded mt-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 