import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initDb, findEmployeeByToken, insertSubmission } from '../../../src/lib/db';
import { uploadPhoto } from '../../../src/lib/storage';

initDb();

function isValidCpf(cpf: string): boolean {
  if (!cpf) return false;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const calcCheck = (base: string) => {
    let sum = 0; for (let i = 0; i < base.length; i++) sum += parseInt(base[i]!, 10) * (base.length + 1 - i);
    const mod = (sum * 10) % 11; return mod === 10 ? 0 : mod;
  };
  const d1 = calcCheck(digits.slice(0, 9));
  const d2 = calcCheck(digits.slice(0, 10));
  return d1 === parseInt(digits[9]!, 10) && d2 === parseInt(digits[10]!, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { token, name, cpf, photoDataUrl } = await req.json();
    if (!name || !cpf || !photoDataUrl) return NextResponse.json({ ok: false, error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    if (!isValidCpf(cpf)) return NextResponse.json({ ok: false, error: 'CPF inválido.' }, { status: 422 });

    if (token) {
      const employee = await findEmployeeByToken(token);
      if (!employee) return NextResponse.json({ ok: false, error: 'Token não encontrado.' }, { status: 404 });
    }

    const match = /^data:(.+);base64,(.+)$/.exec(photoDataUrl);
    if (!match) return NextResponse.json({ ok: false, error: 'Foto inválida.' }, { status: 400 });
    const mimeType = match[1]!;
    const base64 = match[2]!;
    const ext = mimeType.includes('png') ? 'png' : 'jpg';

    // Converte base64 para buffer
    const buffer = Buffer.from(base64, 'base64');
    const fileName = `${uuidv4()}.${ext}`;
    const sanitizedName = name.replace(/[^a-z0-9-_\.]/gi, '_');
    const finalFileName = `${sanitizedName}_${Date.now()}.${ext}`;

    // Faz upload usando o serviço de storage configurado
    const uploadResult = await uploadPhoto(buffer, finalFileName, mimeType);
    
    if (!uploadResult.success) {
      return NextResponse.json({ 
        ok: false, 
        error: uploadResult.error || 'Erro ao fazer upload da foto' 
      }, { status: 500 });
    }

    // Salva no banco de dados
    // photoPath pode ser o caminho local ou a URL/ID do storage
    const photoPath = uploadResult.path || uploadResult.url || uploadResult.fileId || fileName;
    const storageFileId = uploadResult.fileId || uploadResult.url || null;

    await insertSubmission({ 
      employeeToken: token ?? null, 
      name, 
      cpf, 
      photoPath, 
      driveFileId: storageFileId 
    });
    
    return NextResponse.json({ 
      ok: true, 
      fileId: storageFileId,
      url: uploadResult.url 
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro interno.' }, { status: 500 });
  }
}


