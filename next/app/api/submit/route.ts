import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initDb, findEmployeeByToken, insertSubmission } from '../../../src/lib/db';
import { uploadPhoto } from '../../../src/lib/storage';
import { validateImage, sanitizeFileName } from '../../../src/lib/validations';
import { checkRateLimit, getClientIP } from '../../../src/lib/rateLimit';

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
    // Rate limiting
    const clientIP = getClientIP(req);
    const identifier = req.headers.get('x-token') || clientIP;
    const rateLimit = checkRateLimit(identifier);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Muitas requisições. Tente novamente em alguns instantes.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const { token, name, cpf, photoDataUrl, consentAccepted } = await req.json();
    if (!name || !cpf || !photoDataUrl) return NextResponse.json({ ok: false, error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    if (!isValidCpf(cpf)) return NextResponse.json({ ok: false, error: 'CPF inválido.' }, { status: 422 });
    if (!consentAccepted) return NextResponse.json({ ok: false, error: 'É necessário aceitar o termo de consentimento para prosseguir.' }, { status: 400 });

    if (token) {
      const employee = await findEmployeeByToken(token);
      if (!employee) return NextResponse.json({ ok: false, error: 'Token não encontrado.' }, { status: 404 });
    }

    const match = /^data:(.+);base64,(.+)$/.exec(photoDataUrl);
    if (!match) return NextResponse.json({ ok: false, error: 'Foto inválida.' }, { status: 400 });
    const mimeType = match[1]!;
    const base64 = match[2]!;

    // Converte base64 para buffer
    const buffer = Buffer.from(base64, 'base64');

    // Validações de segurança
    const validation = await validateImage(base64, mimeType, buffer);
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const fileName = `${uuidv4()}.${ext}`;
    const sanitizedName = sanitizeFileName(name);
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
      driveFileId: storageFileId,
      consentAccepted: consentAccepted === true
    });
    
    return NextResponse.json({ 
      ok: true, 
      fileId: storageFileId,
      url: uploadResult.url 
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error: any) {
    console.error('Erro ao processar submissão:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error?.message || 'Erro interno ao processar a solicitação.' 
    }, { status: 500 });
  }
}


