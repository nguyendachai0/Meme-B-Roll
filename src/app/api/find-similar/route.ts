export const runtime = 'nodejs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: Request) {
  const { memeId } = await request.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  // Get source meme thumbnail
  const { data: meme } = await supabase
    .from('memes')
    .select('*')
    .eq('id', memeId)
    .single();

  // Get thumbnail as base64
  const { data: thumbData, error: thumbError } = await supabase.storage
    .from('memes')
    .createSignedUrl(meme.thumbnail_path, 60);

  if (thumbError || !thumbData?.signedUrl) {
    return Response.json({ error: "Unable to access thumbnail" }, { status: 400 });
  }

  const imageResponse = await fetch(thumbData.signedUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  // Use Gemini to describe visual characteristics
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const result = await model.generateContent([
    `Describe the visual characteristics of this image in detail: composition, colors, mood, style, objects, actions. Return as comma-separated keywords.`,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    }
  ]);

  const visualKeywords = result.response.text();

  // Search for memes with similar descriptions
  const { data: similar } = await supabase
    .from('memes')
    .select('*')
    .textSearch('search_vector', visualKeywords)
    .neq('id', memeId)
    .limit(10);

  return Response.json({ similar });
}