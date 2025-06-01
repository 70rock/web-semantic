import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export async function POST(request: Request) {
  try {
    const mappings = await request.json();
    const filePath = join(process.cwd(), 'config', 'mappings.json');
    const dirPath = dirname(filePath);

    
    await mkdir(dirPath, { recursive: true });

    await writeFile(filePath, JSON.stringify(mappings, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Mappings saved successfully' });
  } catch (error: any) {
    console.error('Error saving mappings:', error);
    return NextResponse.json({ error: 'Failed to save mappings', details: error.message }, { status: 500 });
  }
} 