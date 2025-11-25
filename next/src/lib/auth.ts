/**
 * Sistema de autenticação simples para painel admin
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

/**
 * Gera hash simples (não use em produção real - use bcrypt)
 */
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Verifica credenciais do admin
 */
export function verifyAdminCredentials(password: string, token?: string): boolean {
  if (token && ADMIN_TOKEN && token === ADMIN_TOKEN) {
    return true;
  }
  if (password && simpleHash(password) === simpleHash(ADMIN_PASSWORD)) {
    return true;
  }
  return false;
}

/**
 * Gera token de sessão simples
 */
export function generateSessionToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
}

// Armazenamento simples de sessões (em produção use Redis ou banco de dados)
const activeSessions = new Set<string>();

/**
 * Adiciona sessão ativa
 */
export function addSession(token: string): void {
  activeSessions.add(token);
  // Remove sessão após 24 horas
  setTimeout(() => activeSessions.delete(token), 24 * 60 * 60 * 1000);
}

/**
 * Middleware para verificar autenticação
 */
export function requireAuth(req: Request): { authorized: boolean; error?: string } {
  const cookieToken = req.headers.get('cookie')?.match(/admin_session=([^;]+)/)?.[1];
  const sessionToken = req.headers.get('x-session-token');

  const token = sessionToken || cookieToken;

  if (!token) {
    return { authorized: false, error: 'Não autenticado' };
  }

  // Verifica se a sessão está ativa
  if (activeSessions.has(token)) {
    return { authorized: true };
  }

  return { authorized: false, error: 'Sessão inválida ou expirada' };
}

