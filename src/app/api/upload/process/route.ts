// src/app/api/upload/process/route.ts
export const runtime = 'nodejs';
import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const { memeId } = await request.json();
  const supabase = getSupabaseAdmin();
  
  try {
    // Get meme data
    const { data: meme, error: memeError } = await supabase
      .from('memes')
      .select('*')
      .eq('id', memeId)
      .single();
    
    if (memeError) throw memeError;
    
    // Download video from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('memes')
      .download(meme.storage_path);
    
    if (downloadError) throw downloadError;
    
    // ✅ Use OS temp directory (works on Windows, Mac, Linux)
    const tempDir = tmpdir();
    const workDir = path.join(tempDir, 'meme-processing');
    
    // Create work directory if it doesn't exist
    if (!existsSync(workDir)) {
      await mkdir(workDir, { recursive: true });
    }
    
    const ext = path.extname(meme.storage_path);
    const tempInput = path.join(workDir, `${memeId}-input${ext}`);
    const tempThumb = path.join(workDir, `${memeId}-thumb.jpg`);
    
    // Save file
    const arrayBuffer = await fileData.arrayBuffer();
    await writeFile(tempInput, Buffer.from(arrayBuffer));
    
    console.log('Processing file:', tempInput);
    
    // Extract video metadata using ffprobe
    const probeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${tempInput}"`;
    console.log('Running:', probeCommand);
    
    const { stdout: probeOutput } = await execAsync(probeCommand);
    const metadata = JSON.parse(probeOutput);
    
    const videoStream = metadata.streams?.find((s: any) => s.codec_type === 'video');
    const duration = metadata.format?.duration ? Math.floor(parseFloat(metadata.format.duration)) : null;
    const width = videoStream?.width;
    const height = videoStream?.height;
    const fileSize = metadata.format?.size;
    
    console.log('Video metadata:', { duration, width, height, fileSize });
    
    // Generate thumbnail at 3 seconds or 10% into video
    const thumbnailTime = duration ? Math.min(3, duration * 0.1) : 3;
    
    const thumbCommand = `ffmpeg -ss ${thumbnailTime} -i "${tempInput}" -vframes 1 -vf "scale=640:-1" -q:v 2 "${tempThumb}"`;
    console.log('Running:', thumbCommand);
    
    await execAsync(thumbCommand);
    
    console.log('Thumbnail generated:', tempThumb);
    
    // Upload thumbnail to storage
    const thumbnailPath = `thumbnails/${memeId}.jpg`;
    const thumbBuffer = await readFile(tempThumb);
    
    const { error: thumbError } = await supabase.storage
      .from('memes')
      .upload(thumbnailPath, thumbBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (thumbError) throw thumbError;
    
    console.log('Thumbnail uploaded:', thumbnailPath);
    
    // Update database with metadata
    const { error: updateError } = await supabase
      .from('memes')
      .update({
        thumbnail_path: thumbnailPath,
        duration_seconds: duration,
        width,
        height,
        file_size_bytes: fileSize
      })
      .eq('id', memeId);
    
    if (updateError) throw updateError;
    
    console.log('Database updated');
    
    // Cleanup temp files
    await unlink(tempInput).catch(err => console.log('Failed to delete input:', err));
    await unlink(tempThumb).catch(err => console.log('Failed to delete thumb:', err));
    
    return Response.json({ success: true, memeId });
    
  } catch (error: any) {
    console.error('Processing error:', error);
    return Response.json(
      { error: error.message || 'Processing failed' },
      { status: 500 }
    );
  }
}