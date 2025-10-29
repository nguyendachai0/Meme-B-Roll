export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const emotion = searchParams.get('emotion');
  const reaction = searchParams.get('reaction');
  const source = searchParams.get('source');
  const memeIdentity = searchParams.get('meme');
  const minDuration = searchParams.get('min_duration');
  const maxDuration = searchParams.get('max_duration');
  const kind = searchParams.get('kind'); // video or image
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  try {
    let queryBuilder = supabase
      .from('memes')
      .select('*', { count: 'exact' });
    
    // Full-text search if query provided
    if (query) {
      queryBuilder = queryBuilder.textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english'
      });
    }
    
    // Apply filters
    if (emotion) {
      queryBuilder = queryBuilder.contains('emotion_tags', [emotion]);
    }
    
    if (reaction) {
      queryBuilder = queryBuilder.contains('reaction_tags', [reaction]);
    }
    
    if (source) {
      queryBuilder = queryBuilder.contains('source_tags', [source]);
    }
    
    if (memeIdentity) {
      queryBuilder = queryBuilder.contains('meme_identity', [memeIdentity]);
    }
    
    if (kind) {
      queryBuilder = queryBuilder.eq('kind', kind);
    }
    
    if (minDuration) {
      queryBuilder = queryBuilder.gte('duration_seconds', parseInt(minDuration));
    }
    
    if (maxDuration) {
      queryBuilder = queryBuilder.lte('duration_seconds', parseInt(maxDuration));
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    const { data, error, count } = await queryBuilder;
    
    if (error) throw error;
    
    // Get thumbnail URLs
    const results = await Promise.all(
      data.map(async (meme) => {
        if (meme.thumbnail_path) {
          const { data: urlData } = await supabase.storage
            .from('memes')
            .createSignedUrl(meme.thumbnail_path, 3600); // 1 hour
          
          return {
            ...meme,
            thumbnail_url: urlData?.signedUrl
          };
        }
        return meme;
      })
    );
    
    return Response.json({
      results,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
    
  } catch (error: any) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}