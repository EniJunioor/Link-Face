import { NextRequest, NextResponse } from 'next/server';
import { initDb, getSubmissionById } from '../../../../src/lib/db';
import { getPhotoUrl } from '../../../../src/lib/storage';
import fs from 'fs';
import path from 'path';

initDb();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const submission = await getSubmissionById(id);
    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 });
    }

    const storageType = process.env.STORAGE_TYPE || 'local';
    
    // Se for storage com URL pública (Vercel Blob, S3)
    if (storageType === 'vercel-blob' || storageType === 's3') {
      const url = getPhotoUrl(submission.drive_file_id, submission.photo_path);
      if (url) {
        return NextResponse.redirect(url);
      }
    }

    // Para storage local ou Google Drive, serve o arquivo
    if (submission.photo_path && fs.existsSync(submission.photo_path)) {
      const fileBuffer = fs.readFileSync(submission.photo_path);
      const ext = path.extname(submission.photo_path).slice(1);
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
  } catch (error: any) {
    console.error('Erro ao buscar foto:', error);
    return NextResponse.json({ error: 'Erro ao buscar foto' }, { status: 500 });
  }
}

