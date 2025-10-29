'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [router]);

  async function generateThumbnail(videoFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      
      video.onloadeddata = () => {
        video.currentTime = Math.min(3, video.duration * 0.1);
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = (video.videoHeight / video.videoWidth) * 640;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.85);
      };
      
      video.onerror = () => reject(new Error('Video loading failed'));
      video.src = URL.createObjectURL(videoFile);
    });
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setError('');
    }
  };

  async function handleUpload() {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError('');

    const totalFiles = files.length;
    let completed = 0;

    for (const file of files) {
      try {
        setStatus(`Uploading ${file.name}...`);
        const path = `uploads/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('memes')
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: meme, error: dbError } = await supabase
          .from('memes')
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ''),
            storage_path: path,
            kind: file.type.startsWith('video') ? 'video' : 'image',
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Process thumbnail and metadata
        await fetch('/api/upload/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memeId: meme.id }),
        });

        completed++;
        setProgress((completed / totalFiles) * 100);
      } catch (err: any) {
        console.error('Upload error for', file.name, err);
        setError(err.message || 'One or more uploads failed.');
      }
    }

    setStatus('All uploads completed!');
    setUploading(false);

    setTimeout(() => {
      router.push('/');
    }, 1000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Upload Card */}
        <Card className="p-8 shadow-xl">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center transition-all
              ${dragActive
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
              ${files.length > 0 ? 'border-green-500 bg-green-50' : ''}
            `}
          >
            <input
              type="file"
              id="file-upload"
              accept="video/*,image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />

            {files.length === 0 ? (
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  Drop your files here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports MP4, MOV, AVI videos and JPG, PNG images
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Maximum file size: 500MB each
                </p>
              </label>
            ) : (
              <div className="space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
                <p className="text-lg font-semibold text-gray-800">
                  {files.length} file{files.length > 1 ? 's' : ''} ready to upload
                </p>

                <div className="max-h-48 overflow-y-auto border rounded-md bg-white p-3 text-left">
                  {files.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center justify-between py-1 border-b last:border-none"
                    >
                      <span className="text-sm text-gray-700 truncate">{f.name}</span>
                      <span className="text-xs text-gray-500">
                        {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  ))}
                </div>

                {!uploading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFiles([])}
                  >
                    Clear Files
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Upload Failed</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-6 space-y-4">
              <Progress value={progress} className="h-3" />
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                <span>{status}</span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            size="lg"
            className="w-full mt-6 h-14 text-lg"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload {files.length > 1 ? 'All Files' : 'File'}
              </>
            )}
          </Button>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="p-4 text-center bg-white/50 backdrop-blur">
            <div className="text-3xl mb-2">🚀</div>
            <p className="font-semibold text-gray-800">Batch Upload</p>
            <p className="text-xs text-gray-600">Upload multiple memes at once</p>
          </Card>
          <Card className="p-4 text-center bg-white/50 backdrop-blur">
            <div className="text-3xl mb-2">🎨</div>
            <p className="font-semibold text-gray-800">Auto Processing</p>
            <p className="text-xs text-gray-600">Thumbnails generated</p>
          </Card>
          <Card className="p-4 text-center bg-white/50 backdrop-blur">
            <div className="text-3xl mb-2">🔍</div>
            <p className="font-semibold text-gray-800">Smart Search</p>
            <p className="text-xs text-gray-600">Tag for discovery</p>
          </Card>
        </div>

        {/* Tips */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-3">💡 Upload Tips</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>You can drag multiple files at once.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Use descriptive filenames for better search tagging.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Thumbnails and metadata are auto-generated after upload.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
