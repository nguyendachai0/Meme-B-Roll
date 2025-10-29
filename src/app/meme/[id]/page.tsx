// src/app/meme/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MemeDetailClient from './MemeDetailClient';

type Props = {
  params: Promise<{ id: string }>; // ✅ Promise in Next.js 16
};

async function getMeme(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/memes/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching meme:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; // ✅ Await params
  const meme = await getMeme(id);
  
  if (!meme) {
    return { title: 'Meme Not Found' };
  }
  
  return {
    title: meme.title,
    description: meme.description || 'View this meme',
  };
}

export default async function MemeDetailPage({ params }: Props) {
  const { id } = await params; // ✅ Await params
  const meme = await getMeme(id);
  
  if (!meme) {
    notFound();
  }
  
  return <MemeDetailClient meme={meme} />;
}