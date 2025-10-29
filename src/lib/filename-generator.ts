export function generateDescriptiveFilename(meme: any): string {
  // Get primary identifiers
  const template = meme.meme_identity?.[0] || '';
  const emotion = meme.emotion_tags?.[0] || '';
  const reaction = meme.reaction_tags?.[0] || '';
  const source = meme.source_tags?.[0] || '';
  
  // Clean strings for filename
  const clean = (str: string) =>
    str
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 20);
  
  // Build filename parts
  const parts = [
    template && clean(template),
    emotion && clean(emotion),
    reaction && clean(reaction),
    source && clean(source)
  ].filter(Boolean);
  
  // Fallback to title if no tags
  if (parts.length === 0) {
    parts.push(clean(meme.title || 'meme'));
  }
  
  const extension = meme.kind === 'video' ? 'mp4' : 'jpg';
  return `${parts.join('_')}.${extension}`;
}