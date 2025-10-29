// src/app/api/memes/[id]/route.ts
export const runtime = 'nodejs';
import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ Must await in Next.js 16
  const supabase = getSupabaseAdmin();
  
  try {
    const { data: meme, error } = await supabase
      .from('memes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!meme) {
      return Response.json(
        { error: 'Meme not found' },
        { status: 404 }
      );
    }
    
    // Get signed URLs
    if (meme.thumbnail_path) {
      const { data: thumbnailData } = await supabase.storage
        .from('memes')
        .createSignedUrl(meme.thumbnail_path, 3600);
      meme.thumbnail_url = thumbnailData?.signedUrl;
    }
    
    if (meme.storage_path) {
      const { data: videoData } = await supabase.storage
        .from('memes')
        .createSignedUrl(meme.storage_path, 3600);
      meme.video_url = videoData?.signedUrl;
    }
    
    return Response.json(meme);
    
  } catch (error: any) {
    console.error('Get meme error:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch meme' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('memes')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return Response.json(data);
    
  } catch (error: any) {
    console.error('Update meme error:', error);
    return Response.json(
      { error: error.message || 'Failed to update meme' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  
  try {
    const { data: meme } = await supabase
      .from('memes')
      .select('storage_path, thumbnail_path')
      .eq('id', id)
      .single();
    
    if (meme) {
      if (meme.storage_path) {
        await supabase.storage.from('memes').remove([meme.storage_path]);
      }
      if (meme.thumbnail_path) {
        await supabase.storage.from('memes').remove([meme.thumbnail_path]);
      }
    }
    
    const { error } = await supabase
      .from('memes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return Response.json({ success: true });
    
  } catch (error: any) {
    console.error('Delete meme error:', error);
    return Response.json(
      { error: error.message || 'Failed to delete meme' },
      { status: 500 }
    );
  }
}