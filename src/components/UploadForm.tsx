'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function UploadForm() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile || !coverFile) {
      return alert("Both files are required")
    }

    const formData = new FormData()
    formData.append("media", audioFile) // ✅ fixed field name
    formData.append("cover", coverFile)

    setLoading(true)
    setDownloadUrl(null)

    const res = await fetch('/api/convert', {
      method: "POST",
      body: formData,
    })

    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
    } else {
      alert("Conversion failed")
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-zinc-900 rounded-xl border border-zinc-700 max-w-lg mx-auto mt-10 text-white">
      <div>
        <label className="block mb-1 font-medium">Upload MP3/MP4</label>
        <input
          type="file"
          accept=".mp3,.mp4"
          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          className="text-white"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Upload Cover Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          className="text-white"
        />
      </div>
      <Button type="submit" disabled={loading || !audioFile || !coverFile} className="w-full">
        {loading ? "Converting..." : "Convert"}
      </Button>

      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="block text-green-400 mt-4 underline text-center"
        >
          Download Converted File
        </a>
      )}
    </form>
  )
}
