import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  const historyFilePath = join(process.cwd(), 'import-history.json');

  try {
    const historyData = await readFile(historyFilePath, 'utf-8');
    const history = JSON.parse(historyData);
    return NextResponse.json(history);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      
      return NextResponse.json([], { status: 200 });
    } else if (error.name === 'SyntaxError') {
      
      console.error('Error parsing import history file:', error);
      return NextResponse.json([], { status: 200 });
    } else {
      
      console.error('Error reading import history:', error);
      return NextResponse.json(
        { message: 'Error al leer el historial de importaciones', error: error.message },
        { status: 500 }
      );
    }
  }
} 