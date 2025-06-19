import { NextRequest, NextResponse } from 'next/server'
import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'

// Required by Formidable
export const config = {
  api: {
    bodyParser: false,
  },
}

ffmpeg.setFfmpegPath(ffmpegPath || '')

export async function POST(req: NextRequest) {
  return new Promise((resolve) => {
    const form = new IncomingForm({ uploadDir: '/tmp', keepExtensions: true })

    // ✅ Grab the internal raw Node.js req
    const nodeRequest = (req as any).node?.req
    if (!nodeRequest) {
      return resolve(
        NextResponse.json({ error: 'Invalid request object' }, { status: 500 })
      )
    }

    form.parse(nodeRequest, async (err, fields, files: any) => {
      if (err) {
        console.error('❌ Form parse error:', err)
        return resolve(
          NextResponse.json({ error: 'Form parsing failed' }, { status: 500 })
        )
      }

      const mediaFile = files.media?.[0] || files.media
      const imageFile = files.cover?.[0] || files.cover

      if (!mediaFile || !imageFile) {
        return resolve(
          NextResponse.json(
            { error: 'Both media and image are required' },
            { status: 400 }
          )
        )
      }

      const outputPath = path.join('/tmp', `converted-${Date.now()}.mp3`)

      ffmpeg(mediaFile.filepath)
        .input(imageFile.filepath)
        .outputOptions([
          '-map 0:0',
          '-map 1:0',
          '-c:a libmp3lame',
          '-c:v:0 mjpeg',
          '-id3v2_version 3',
          '-metadata:s:v title="Album cover"',
          '-metadata:s:v comment="Cover (front)"',
        ])
        .save(outputPath)
        .on('start', (cmd: string) => console.log('🎬 FFmpeg started:', cmd))
        .on('progress', (p: any) => console.log('Progress:', p))
        .on('end', () => {
          console.log('✅ FFmpeg conversion complete')
          const buffer = fs.readFileSync(outputPath)
          fs.unlinkSync(outputPath)
          resolve(
            new NextResponse(buffer, {
              headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'attachment; filename="output.mp3"',
              },
            })
          )
        })
        .on('error', (err: Error) => {
          console.error('❌ FFmpeg error:', err)
          resolve(
            NextResponse.json({ error: 'Failed to convert file' }, { status: 500 })
          )
        })
    })
  })
}
