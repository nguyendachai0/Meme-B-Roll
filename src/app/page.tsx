// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Upload, Download, Trash2 } from 'lucide-react';

export default function Home() {
  const [memes, setMemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadMemes();

    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  async function loadMemes() {
    const { data, error } = await supabase
      .from('memes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      // Get thumbnail URLs
      const memesWithUrls = await Promise.all(
        data.map(async (meme) => {
          if (meme.thumbnail_path) {
            const { data: urlData } = await supabase.storage
              .from('memes')
              .createSignedUrl(meme.thumbnail_path, 3600);
            return { ...meme, thumbnail_url: urlData?.signedUrl };
          }
          return meme;
        })
      );
      setMemes(memesWithUrls);
    }
    setLoading(false);
  }

  async function handleDelete(memeId: string) {
    const meme = memes.find(m => m.id === memeId);
    const confirmMessage = `Delete "${meme?.title || 'this meme'}"?\n\nThis cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/memes/${memeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      // Remove from UI immediately
      setMemes(memes.filter(m => m.id !== memeId));

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successDiv.textContent = '✅ Meme deleted successfully';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);

    } catch (error: any) {
      alert('❌ Failed to delete: ' + error.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : memes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No memes yet. Be the first to upload!</p>
            <Link href="/upload">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload First Meme
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {memes.map((meme) => (
              <div
                key={meme.id}
                className="group relative aspect-video overflow-hidden rounded-xl bg-gray-200 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer"
                onClick={() => window.location.href = `/api/download/${meme.id}`}
              >
                {meme.thumbnail_url ? (
                  <img
                    src={meme.thumbnail_url}
                    alt={meme.title || 'Meme'}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    No thumbnail
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-2 text-white">
                    <Download className="h-6 w-6" />
                    <span className="text-xs font-medium">Click to Download</span>
                  </div>
                </div>

                {/* Delete button (shows on hover) */}
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(meme.id);
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    title="Delete meme"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                {/* Duration tag (bottom-right corner) */}
                {meme.duration_seconds && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                    {meme.duration_seconds}s
                  </div>
                )}

                {/* Title on hover (bottom-left) */}
                <div className="absolute bottom-2 left-2 max-w-[70%] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-white bg-black/70 px-2 py-1 rounded-md backdrop-blur-sm line-clamp-1">
                    {meme.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}