// /app/api/generate-title/route.ts
export const runtime = 'nodejs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: Request) {
  const { memeId } = await request.json();
  
  const { data: meme } = await supabase
    .from('memes')
    .select('*')
    .eq('id', memeId)
    .single();

  // Get thumbnail
  const { data: thumbData, error: thumbError } = await supabase.storage
    .from('memes')
    .createSignedUrl(meme.thumbnail_path, 60);

  if (thumbError || !thumbData?.signedUrl) {
    return Response.json({ error: "Unable to access thumbnail" }, { status: 400 });
  }

  const imageResponse = await fetch(thumbData.signedUrl);
  const base64Image = Buffer.from(await imageResponse.arrayBuffer()).toString('base64');

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const result = await model.generateContent([
    `Generate a short, descriptive title (3-6 words) for this meme/B-roll clip. Focus on the main action, emotion, or situation. Examples: "Happy Office Worker Celebrating", "Confused Cat Staring", "Dramatic Sunset Over City". Return only the title.`,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    }
  ]);

  const suggestedTitle = result.response.text().trim();

  return Response.json({ title: suggestedTitle });
}