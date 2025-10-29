import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  try {
    let query = supabase
      .from('tag_suggestions')
      .select('tag, usage_count, category')
      .order('usage_count', { ascending: false })
      .limit(limit);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return Response.json({ tags: data });
    
  } catch (error: any) {
    console.error('Tags error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}