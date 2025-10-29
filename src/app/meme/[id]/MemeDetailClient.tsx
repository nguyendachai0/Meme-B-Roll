// src/app/meme/[id]/MemeDetailClient.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DeleteMemeDialog } from '@/components/DeleteMemeDialog';

export default function MemeDetailClient({ meme }: { meme: any }) {
  const router = useRouter();
  
  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Media Preview */}
        <div>
          {meme.kind === 'video' && meme.video_url && (
            <video 
              src={meme.video_url} 
              controls 
              className="w-full rounded-lg shadow-lg"
            />
          )}
          {meme.kind === 'image' && meme.video_url && (
            <img 
              src={meme.video_url} 
              alt={meme.title}
              className="w-full rounded-lg shadow-lg"
            />
          )}
          {meme.thumbnail_url && !meme.video_url && (
            <img 
              src={meme.thumbnail_url} 
              alt={meme.title}
              className="w-full rounded-lg shadow-lg"
            />
          )}
        </div>
        
        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{meme.title}</h1>
            {meme.description && (
              <p className="text-gray-600">{meme.description}</p>
            )}
          </div>
          
          {/* Tags */}
          {meme.emotion_tags?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Emotions</h3>
              <div className="flex flex-wrap gap-2">
                {meme.emotion_tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {meme.reaction_tags?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Reactions</h3>
              <div className="flex flex-wrap gap-2">
                {meme.reaction_tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {meme.source_tags?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Source</h3>
              <div className="flex flex-wrap gap-2">
                {meme.source_tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Metadata */}
          <Card className="p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {meme.duration_seconds && (
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-semibold">{meme.duration_seconds}s</span>
                </div>
              )}
              {meme.width && meme.height && (
                <div>
                  <span className="text-gray-600">Resolution:</span>
                  <span className="ml-2 font-semibold">{meme.width}×{meme.height}</span>
                </div>
              )}
              {meme.tag_quality_score !== undefined && (
                <div>
                  <span className="text-gray-600">Quality Score:</span>
                  <span className="ml-2 font-semibold">{meme.tag_quality_score}/100</span>
                </div>
              )}
              {meme.download_count !== undefined && (
                <div>
                  <span className="text-gray-600">Downloads:</span>
                  <span className="ml-2 font-semibold">{meme.download_count}</span>
                </div>
              )}
            </div>
          </Card>
          
          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                size="lg"
                onClick={() => window.location.href = `/api/download/${meme.id}`}
              >
                <Download className="mr-2 h-5 w-5" />
                Download
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => router.push(`/meme/${meme.id}/edit`)}
              >
                <Edit className="mr-2 h-5 w-5" />
                Edit Tags
              </Button>
            </div>
            
            {/* Delete Button */}
            <DeleteMemeDialog 
              memeId={meme.id} 
              memeTitle={meme.title} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}