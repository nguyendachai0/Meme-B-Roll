import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { filename, contentType } = await request.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  // Generate unique storage path
  const timestamp = Date.now();
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `uploads/${timestamp}-${cleanFilename}`;
  
  // Create signed upload URL (valid for 10 minutes)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('memes')
    .createSignedUploadUrl(path);
  
  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }
  
  // Create placeholder DB entry
  const { data: meme, error: dbError } = await supabase
    .from('memes')
    .insert({
      title: filename.replace(/\.[^/.]+$/, ''), // Remove extension
      storage_path: path,
      kind: contentType.startsWith('video') ? 'video' : 'image'
    })
    .select()
    .single();
  
  if (dbError) {
    return Response.json({ error: dbError.message }, { status: 500 });
  }
  
  return Response.json({
    uploadUrl: uploadData.signedUrl,
    memeId: meme.id,
    path
  });
}