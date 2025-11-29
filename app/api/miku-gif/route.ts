import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // libフォルダのGIFファイルを読み込む
    const filePath = join(process.cwd(), 'lib', 'u6455584253_httpss.mj.runmGK5-8yzwyE_ultra_cute_chibi_anime_g_92089379-5a89-412a-8b22-12d2e596ad55_2.gif');
    const fileBuffer = readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}

