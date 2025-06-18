import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: nextRequest) {
    return new Promise((resolve) => {
        const form = new IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

        form.parse(req as any, async (err, fields, files) => {
            if(err) {
                console.error("error parsing form:", err);
                return resolve(NextResponse.json({ error: 'Form parsing failed' }, { status: 500 }));
            }

            const mediaFile = files.media?.[0] || files.media;
            const imageFile = files.cover?.[0] || files.images;     
            
            if (!mediaFile || !imageFile) {
                return resolve(NextResponse.json({ error : "Both the files are required" }, { status: 400}));

            }
                const outputPath = path.join('/tmp', `converted-${Date.now()}.mp4`);

            }
         })
    })
}