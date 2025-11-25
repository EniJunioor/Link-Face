/**
 * Validações de segurança para upload de imagens
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
}

const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || '5242880'); // 5MB padrão
const MAX_BASE64_SIZE = parseInt(process.env.MAX_BASE64_SIZE || '7000000'); // ~7MB (base64 é ~33% maior)
const MIN_DIMENSION = parseInt(process.env.MIN_IMAGE_DIMENSION || '200'); // 200px mínimo
const ALLOWED_MIME_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',');

/**
 * Valida o tamanho do base64
 */
export function validateBase64Size(base64: string): { valid: boolean; error?: string } {
  const size = Buffer.byteLength(base64, 'utf8');
  if (size > MAX_BASE64_SIZE) {
    return {
      valid: false,
      error: `Imagem muito grande. Tamanho máximo: ${Math.round(MAX_BASE64_SIZE / 1024 / 1024)}MB`
    };
  }
  return { valid: true };
}

/**
 * Valida tipo MIME da imagem
 */
export function validateMimeType(mimeType: string): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Use: ${ALLOWED_MIME_TYPES.map(t => t.split('/')[1]).join(', ')}`
    };
  }
  return { valid: true };
}

/**
 * Valida dimensões da imagem
 */
export async function validateImageDimensions(buffer: Buffer): Promise<{ valid: boolean; width?: number; height?: number; error?: string }> {
  try {
    const sharp = await import('sharp').catch(() => null);
    
    if (!sharp) {
      // Se sharp não estiver disponível, pula validação de dimensões
      return { valid: true };
    }

    const metadata = await sharp.default(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      return {
        valid: false,
        width,
        height,
        error: `Imagem muito pequena. Dimensão mínima: ${MIN_DIMENSION}x${MIN_DIMENSION}px. Sua imagem: ${width}x${height}px`
      };
    }

    return { valid: true, width, height };
  } catch (error) {
    return { valid: true }; // Se falhar, permite (não bloqueia)
  }
}

/**
 * Valida tamanho do buffer
 */
export function validateBufferSize(buffer: Buffer): { valid: boolean; error?: string } {
  if (buffer.length > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Imagem muito grande. Tamanho máximo: ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)}MB`
    };
  }
  return { valid: true };
}

/**
 * Validação completa da imagem
 */
export async function validateImage(
  base64: string,
  mimeType: string,
  buffer: Buffer
): Promise<ImageValidationResult> {
  // Valida tamanho do base64
  const base64Check = validateBase64Size(base64);
  if (!base64Check.valid) {
    return { valid: false, error: base64Check.error };
  }

  // Valida tipo MIME
  const mimeCheck = validateMimeType(mimeType);
  if (!mimeCheck.valid) {
    return { valid: false, error: mimeCheck.error };
  }

  // Valida tamanho do buffer
  const bufferCheck = validateBufferSize(buffer);
  if (!bufferCheck.valid) {
    return { valid: false, error: bufferCheck.error };
  }

  // Valida dimensões
  const dimensionsCheck = await validateImageDimensions(buffer);
  if (!dimensionsCheck.valid) {
    return {
      valid: false,
      error: dimensionsCheck.error,
      width: dimensionsCheck.width,
      height: dimensionsCheck.height
    };
  }

  return {
    valid: true,
    size: buffer.length,
    width: dimensionsCheck.width,
    height: dimensionsCheck.height,
    mimeType
  };
}

/**
 * Sanitiza nome de arquivo para prevenir path traversal
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-z0-9._-]/gi, '_')
    .replace(/\.\./g, '_')
    .replace(/^\/+|\/+$/g, '')
    .slice(0, 255); // Limita tamanho
}

