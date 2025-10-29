'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  async function handleUpload(file: File) {
    setUploading(true);
    setProgress(0);
    
    try {
      // Step 1: Request upload URL
      const { uploadUrl, memeId, path } = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type
        })
      }).then(r => r.json());
      
      // Step 2: Upload to Supabase Storage with progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      
      await new Promise((resolve, reject) => {
        xhr.addEventListener('load', resolve);
        xhr.addEventListener('error', reject);
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
      
      // Step 3: Trigger processing
      await fetch('/api/upload/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memeId, path })
      });
      
      // Redirect to tagging page
      window.location.href = `/meme/${memeId}/edit`;
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }
  
  return (
    <div>
      <input
        type="file"
        accept="video/*,image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      {uploading && <Progress value={progress} className="mt-4" />}
    </div>
  );
}