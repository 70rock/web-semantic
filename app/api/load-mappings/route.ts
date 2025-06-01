import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'config', 'mappings.json');
    
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      const mappings = JSON.parse(fileContent);
      return NextResponse.json(mappings);
    } catch (readError: any) {
      
      if (readError.code === 'ENOENT') {
        return NextResponse.json({
          classMappings: [],
          propertyMappings: [],
          languageMappings: [],
        });
      }
      
      throw readError;
    }

  } catch (error: any) {
    console.error('Error loading mappings:', error);
    return NextResponse.json({ error: 'Failed to load mappings', details: error.message }, { status: 500 });
  }
} 