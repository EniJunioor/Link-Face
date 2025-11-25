import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, generateSessionToken, addSession } from '../../../../src/lib/auth';
import { logger } from '../../../../src/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { password, token } = await req.json();

    if (!password && !token) {
      return NextResponse.json({ ok: false, error: 'Senha ou token é obrigatório' }, { status: 400 });
    }

    const isValid = verifyAdminCredentials(password || '', token);

    if (!isValid) {
      logger.warn('Tentativa de login inválida', { hasPassword: !!password, hasToken: !!token });
      return NextResponse.json({ ok: false, error: 'Credenciais inválidas' }, { status: 401 });
    }

    const sessionToken = generateSessionToken();
    addSession(sessionToken);
    
    logger.info('Login admin realizado com sucesso');

    return NextResponse.json({
      ok: true,
      token: sessionToken
    }, {
      headers: {
        'Set-Cookie': `admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400; Secure=${process.env.NODE_ENV === 'production'}`
      }
    });
  } catch (error: any) {
    logger.error('Erro ao autenticar', error);
    return NextResponse.json({ ok: false, error: 'Erro ao autenticar' }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ ok: true }, {
    headers: {
      'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
    }
  });
}

