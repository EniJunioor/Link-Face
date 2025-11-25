/**
 * Rate limiting simples em memória
 * Para produção, considere usar Redis ou serviço externo
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000'); // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'); // 10 requisições por minuto

/**
 * Limpa entradas expiradas periodicamente
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

/**
 * Verifica rate limit por IP ou token
 */
export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Nova entrada ou expirada
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT_WINDOW
    };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Obtém IP do request
 */
export function getClientIP(req: { headers: Headers }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
}

