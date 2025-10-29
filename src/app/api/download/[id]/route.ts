// src/app/api/download/[id]/route.ts
export const runtime = 'nodejs';
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
      .select('*')
      .eq('id', id)
      .single();
    
    if (memeError) throw memeError;
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('memes')
      .download(meme.storage_path);
    
    if (downloadError) throw downloadError;
    
    const buffer = await fileData.arrayBuffer();
    
    // Generate descriptive filename
    const emotion = meme.emotion_tags?.[0] || 'meme';
    const reaction = meme.reaction_tags?.[0] || '';
    const source = meme.source_tags?.[0] || '';
    
    const filenameParts = [
      meme.meme_identity?.[0] || meme.title,
      emotion,
      reaction,
      source
    ].filter(Boolean).map(s => s.replace(/[^a-z0-9]/gi, ''));
    
    const filename = `${filenameParts.join('_')}.${meme.kind === 'video' ? 'mp4' : 'jpg'}`;
    
    // Increment download count
    await supabase
      .from('memes')
      .update({ download_count: (meme.download_count || 0) + 1 })
      .eq('id', id);
    
    return new Response(buffer, {
      headers: {
        'Content-Type': meme.kind === 'video' ? 'video/mp4' : 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });
    
  } catch (error: any) {
    console.error('Download error:', error);
    return Response.json(
      { error: error.message || 'Failed to download' },
      { status: 500 }
    );
  }
}