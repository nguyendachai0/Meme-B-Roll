import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function embedMetadata(
  inputPath: string,
  outputPath: string,
  meme: any
): Promise<void> {
  // Build ExifTool command
  const tags = [
    `-Title="${meme.title}"`,
    `-Description="${meme.description || ''}"`,
    `-Comment="Emotions: ${meme.emotion_tags?.join(', ')} | Reactions: ${meme.reaction_tags?.join(', ')}"`,
    `-Keywords="${[
      ...(meme.emotion_tags || []),
      ...(meme.reaction_tags || []),
      ...(meme.source_tags || []),
      ...(meme.object_tags || [])
    ].join(';')}"`,
    `-Artist="${meme.source_tags?.[0] || 'Unknown'}"`,
    `-Copyright="User uploaded content"`
  ];
  
  const command = `exiftool ${tags.join(' ')} -o "${outputPath}" "${inputPath}"`;
  
  await execAsync(command);
}