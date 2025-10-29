import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { name, memeIds } = await request.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  // Create collection
  const { data: collection } = await supabase
    .from('collections')
    .insert({ name })
    .select()
    .single();

  // Add memes
  await supabase
    .from('collection_memes')
    .insert(
      memeIds.map((memeId: string) => ({
        collection_id: collection.id,
        meme_id: memeId
      }))
    );

  return Response.json({ collection });
}