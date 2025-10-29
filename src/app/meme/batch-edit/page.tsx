'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function BatchEditPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);

  async function applyBatchTags() {
    for (const memeId of selected) {
      const { data: meme } = await supabase
        .from('memes')
        .select('emotion_tags')
        .eq('id', memeId)
        .single();

      await supabase
        .from('memes')
        .update({
          emotion_tags: [...new Set([...(meme?.emotion_tags || []), ...tagsToAdd])]
        })
        .eq('id', memeId);
    }
    
    alert('Batch tags applied!');
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Batch Edit Tags</h1>
      {/* Grid of memes with checkboxes */}
      {/* Tag input */}
      <Button onClick={applyBatchTags}>Apply to Selected</Button>
    </div>
  );
}