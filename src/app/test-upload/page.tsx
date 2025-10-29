// src/app/test-upload/page.tsx
'use client';

import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function TestUploadPage() {
  const [result, setResult] = useState('');

  async function testInsert() {
    const { data, error } = await supabase
      .from('memes')
      .insert({
        title: 'Test Meme',
        storage_path: 'test/test.mp4',
        kind: 'video'
      })
      .select()
      .single();

    if (error) {
      setResult('❌ Error: ' + error.message);
    } else {
      setResult('✅ Success! ID: ' + data.id);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Upload</h1>
      <button 
        onClick={testInsert}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Insert
      </button>
      <p className="mt-4">{result}</p>
    </div>
  );
}