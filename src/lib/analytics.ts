// import { supabase } from "./supabase";

// // /lib/analytics.ts
// export async function trackEvent(event: string, properties?: any) {
//   await supabase
//     .from('analytics_events')
//     .insert({
//       event_name: event,
//       properties,
//       timestamp: new Date().toISOString()
//     });
// }

// // Usage
// await trackEvent('search', { query, results_count: results.length });
// await trackEvent('download', { meme_id: memeId });
// await trackEvent('tag_suggestion_used', { meme_id: memeId, source: 'gemini' });