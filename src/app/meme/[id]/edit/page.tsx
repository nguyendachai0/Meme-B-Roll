// src/app/meme/[id]/edit/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TagInput } from '@/components/TagInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function EditMemePage() {
  const params = useParams<{ id: string }>();
  const [meme, setMeme] = useState<any>(null);
  const [tags, setTags] = useState<any>({
    emotion_tags: [],
    reaction_tags: [],
    situation_tags: [],
    meme_identity: [],
    source_tags: [],
    object_tags: [],
    character_tags: [],
    action_tags: [],
    color_tags: [],
    time_tags: []
  });
  
  useEffect(() => {
    fetch(`/api/memes/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setMeme(data);
        setTags({
          emotion_tags: data.emotion_tags || [],
          reaction_tags: data.reaction_tags || [],
          situation_tags: data.situation_tags || [],
          meme_identity: data.meme_identity || [],
          source_tags: data.source_tags || [],
          object_tags: data.object_tags || [],
          character_tags: data.character_tags || [],
          action_tags: data.action_tags || [],
          color_tags: data.color_tags || [],
          time_tags: data.time_tags || []
        });
      });
  }, [params.id]);
  
  async function saveTags() {
    const response = await fetch(`/api/memes/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tags)
    });
    
    if (response.ok) {
      alert('✅ Tags saved!');
      window.location.href = `/meme/${params.id}`;
    } else {
      alert('❌ Failed to save tags');
    }
  }
  
  if (!meme) return (
    <div className="container mx-auto p-8 text-center">
      <p>Loading...</p>
    </div>
  );
  
  const tagCategories = [
    { key: 'emotion_tags', label: 'Emotions' },
    { key: 'reaction_tags', label: 'Reactions' },
    { key: 'situation_tags', label: 'Situations' },
    { key: 'meme_identity', label: 'Meme Template' },
    { key: 'source_tags', label: 'Source' },
    { key: 'object_tags', label: 'Objects' },
    { key: 'character_tags', label: 'Characters' },
    { key: 'action_tags', label: 'Actions' },
    { key: 'color_tags', label: 'Colors' },
    { key: 'time_tags', label: 'Time of Day' }
  ];
  
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Edit Tags: {meme.title}</h1>
        {meme.thumbnail_url && (
          <img 
            src={meme.thumbnail_url}
            alt="Thumbnail" 
            className="w-full max-w-md rounded-lg shadow-lg"
          />
        )}
      </div>
      
      <Card className="p-6 mb-6 bg-blue-50">
        <h3 className="font-semibold mb-2">💡 Tagging Tips:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Use quick-add buttons for common tags</li>
          <li>• Type custom tags and press Enter</li>
          <li>• More tags = better discoverability</li>
          <li>• Aim for 70+ quality score</li>
        </ul>
      </Card>
      
      <div className="space-y-6">
        {tagCategories.map(({ key, label }) => (
          <TagInput
            key={key}
            label={label}
            category={key}
            value={tags[key]}
            onChange={(newTags) => setTags({ ...tags, [key]: newTags })}
          />
        ))}
      </div>
      
      <div className="mt-8 flex gap-4">
        <Button onClick={saveTags} className="flex-1" size="lg">
          Save Tags
        </Button>
        <Button variant="outline" onClick={() => window.history.back()} size="lg">
          Cancel
        </Button>
      </div>
      
      {meme.tag_quality_score !== undefined && (
        <Card className="mt-6 p-4 text-center">
          <p className="text-sm text-gray-600">
            Tag Quality Score: <span className="font-bold text-2xl">{meme.tag_quality_score}/100</span>
          </p>
          {meme.tag_quality_score < 70 && (
            <p className="text-orange-600 text-sm mt-2">
              ⚠️ Add more tags to improve discoverability
            </p>
          )}
          {meme.tag_quality_score >= 70 && (
            <p className="text-green-600 text-sm mt-2">
              ✅ Great tagging! This meme is highly discoverable
            </p>
          )}
        </Card>
      )}
    </div>
  );
}