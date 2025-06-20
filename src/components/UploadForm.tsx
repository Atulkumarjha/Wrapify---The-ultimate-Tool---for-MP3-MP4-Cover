'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Script from 'next/script';

export default function UploadForm() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState({
    ffmpeg: false,
    util: false,
    core: false,
  });

  // References to the FFmpeg modules loaded via scripts
  const ffmpegRef = useRef<any>(null);
  const utilsRef = useRef<any>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !coverFile || !isReady()) {
      return alert("Files and FFmpeg are required to proceed");
    }

    setLoading(true);
    setDownloadUrl(null);
    setProgress(0);
    
    try {
      // Create FFmpeg instance
      const FFmpeg = ffmpegRef.current;
      const { fetchFile } = utilsRef.current;
      
      const ffmpeg = new FFmpeg.FFmpeg();
      
      // Set up event handlers
      ffmpeg.on('log', ({ message }: { message: string }) => {
        console.log(`[FFmpeg] ${message}`);
      });
      
      ffmpeg.on('progress', ({ ratio }: { ratio: number }) => {
        setProgress(Math.floor(ratio * 100));
      });
      
      // Load FFmpeg
      await ffmpeg.load();
      
      // Get file extensions and prepare file names
      const getFileExtension = (file: File) => {
        return file.name.split('.').pop()?.toLowerCase() || 'mp4';
      };
      
      const mediaExt = getFileExtension(audioFile);
      const coverExt = getFileExtension(coverFile);
      const outputExt = mediaExt === 'mp3' ? 'mp4' : mediaExt;
      
      console.log(`Processing: media.${mediaExt}, cover.${coverExt}, output.${outputExt}`);
      
      // Convert files to binary data
      const mediaData = await fetchFile(audioFile);
      const coverData = await fetchFile(coverFile);
      
      // Write files to FFmpeg virtual file system
      await ffmpeg.writeFile('input.' + mediaExt, mediaData);
      await ffmpeg.writeFile('cover.' + coverExt, coverData);
      
      // Run FFmpeg command to combine audio and image
      await ffmpeg.exec(
        '-i', `input.${mediaExt}`,
        '-i', `cover.${coverExt}`,
        '-map', '0:a',
        '-map', '1:v',
        '-c:a', 'copy',
        '-c:v', 'libx264',
        '-shortest',
        `output.${outputExt}`
      );
      
      // Read the output file
      const outputData = await ffmpeg.readFile(`output.${outputExt}`);
      
      // Create blob and URL
      const blob = new Blob([outputData], { 
        type: mediaExt === 'mp3' ? 'video/mp4' : `video/${outputExt}` 
      });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      // Clean up virtual file system
      await ffmpeg.deleteFile('input.' + mediaExt);
      await ffmpeg.deleteFile('cover.' + coverExt);
      await ffmpeg.deleteFile('output.' + outputExt);
    } catch (error) {
      console.error("Error during conversion:", error);
      alert("An error occurred during conversion: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };
  
  // Check if all scripts are loaded
  const isReady = () => {
    return scriptsLoaded.ffmpeg && scriptsLoaded.util && scriptsLoaded.core;
  };
  
  // Script load handlers
  const handleFFmpegLoad = () => {
    ffmpegRef.current = window.FFmpeg;
    setScriptsLoaded(prev => ({ ...prev, ffmpeg: true }));
    console.log("FFmpeg script loaded");
  };
  
  const handleUtilLoad = () => {
    utilsRef.current = window.FFmpegUtil;
    setScriptsLoaded(prev => ({ ...prev, util: true }));
    console.log("FFmpeg Util script loaded");
  };
  
  const handleCoreLoad = () => {
    setScriptsLoaded(prev => ({ ...prev, core: true }));
    console.log("FFmpeg Core script loaded");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-zinc-900 rounded-xl border border-zinc-700 max-w-lg mx-auto mt-10 text-white">
      <div>
        <label className="block mb-1 font-medium">Upload MP3/MP4</label>
        <input
          type="file"
          accept=".mp3,.mp4"
          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          className="text-white"
          disabled={loading}
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Upload Cover Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          className="text-white"
          disabled={loading}
        />
      </div>
      
      {loading && progress > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm mt-1">{progress}% processed</p>
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={loading || !audioFile || !coverFile} 
        className="w-full"
      >
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
  );
}
