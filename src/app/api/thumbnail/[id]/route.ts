// src/app/api/thumbnail/[id]/route.ts
import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  
  try {
    const { data: meme, error: memeError } = await supabase
      .from('memes')
      .select('thumbnail_path')
      .eq('id', id)
      .single();
    
    if (memeError) throw memeError;
    
    if (!meme?.thumbnail_path) {
      return Response.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      );
    }
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('memes')
      .download(meme.thumbnail_path);
    
    if (downloadError) throw downloadError;
    
    const buffer = await fileData.arrayBuffer();
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
  } catch (error: any) {
    console.error('Thumbnail error:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch thumbnail' },
      { status: 500 }
    );
  }
}