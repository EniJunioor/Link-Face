/**
 * Validação de variáveis de ambiente
 */

interface EnvConfig {
  STORAGE_TYPE: string;
  MAX_IMAGE_SIZE: number;
  MAX_BASE64_SIZE: number;
  MIN_IMAGE_DIMENSION: number;
  ALLOWED_IMAGE_TYPES: string[];
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  ADMIN_PASSWORD: string;
  NEXT_PUBLIC_APP_URL: string;
}

const defaults: EnvConfig = {
  STORAGE_TYPE: 'local',
  MAX_IMAGE_SIZE: 5242880, // 5MB
  MAX_BASE64_SIZE: 7000000, // ~7MB
  MIN_IMAGE_DIMENSION: 200,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  RATE_LIMIT_WINDOW: 60000, // 1 minuto
  RATE_LIMIT_MAX_REQUESTS: 10,
  ADMIN_PASSWORD: 'admin123',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
};

export function validateEnv(): { valid: boolean; errors: string[]; config: EnvConfig } {
  const errors: string[] = [];
  const config: EnvConfig = { ...defaults };

  // Valida STORAGE_TYPE
  const storageType = process.env.STORAGE_TYPE || defaults.STORAGE_TYPE;
  if (!['local', 'vercel-blob', 's3', 'drive'].includes(storageType)) {
    errors.push(`STORAGE_TYPE inválido: ${storageType}. Use: local, vercel-blob, s3, ou drive`);
  }
  config.STORAGE_TYPE = storageType;

  // Valida tamanhos
  const maxImageSize = parseInt(process.env.MAX_IMAGE_SIZE || String(defaults.MAX_IMAGE_SIZE));
  if (isNaN(maxImageSize) || maxImageSize <= 0) {
    errors.push('MAX_IMAGE_SIZE deve ser um número positivo');
  } else {
    config.MAX_IMAGE_SIZE = maxImageSize;
  }

  const maxBase64Size = parseInt(process.env.MAX_BASE64_SIZE || String(defaults.MAX_BASE64_SIZE));
  if (isNaN(maxBase64Size) || maxBase64Size <= 0) {
    errors.push('MAX_BASE64_SIZE deve ser um número positivo');
  } else {
    config.MAX_BASE64_SIZE = maxBase64Size;
  }

  const minDimension = parseInt(process.env.MIN_IMAGE_DIMENSION || String(defaults.MIN_IMAGE_DIMENSION));
  if (isNaN(minDimension) || minDimension <= 0) {
    errors.push('MIN_IMAGE_DIMENSION deve ser um número positivo');
  } else {
    config.MIN_IMAGE_DIMENSION = minDimension;
  }

  // Valida tipos de imagem
  const allowedTypes = process.env.ALLOWED_IMAGE_TYPES 
    ? process.env.ALLOWED_IMAGE_TYPES.split(',').map(t => t.trim())
    : defaults.ALLOWED_IMAGE_TYPES;
  config.ALLOWED_IMAGE_TYPES = allowedTypes;

  // Valida rate limiting
  const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW || String(defaults.RATE_LIMIT_WINDOW));
  if (isNaN(rateLimitWindow) || rateLimitWindow <= 0) {
    errors.push('RATE_LIMIT_WINDOW deve ser um número positivo');
  } else {
    config.RATE_LIMIT_WINDOW = rateLimitWindow;
  }

  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || String(defaults.RATE_LIMIT_MAX_REQUESTS));
  if (isNaN(rateLimitMax) || rateLimitMax <= 0) {
    errors.push('RATE_LIMIT_MAX_REQUESTS deve ser um número positivo');
  } else {
    config.RATE_LIMIT_MAX_REQUESTS = rateLimitMax;
  }

  // Valida admin password
  config.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || defaults.ADMIN_PASSWORD;
  if (config.ADMIN_PASSWORD === defaults.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
    errors.push('ADMIN_PASSWORD deve ser alterado em produção!');
  }

  // Valida URL da aplicação
  config.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || defaults.NEXT_PUBLIC_APP_URL;

  // Validações específicas por storage type
  if (storageType === 's3') {
    if (!process.env.AWS_ACCESS_KEY_ID) errors.push('AWS_ACCESS_KEY_ID é obrigatório para S3');
    if (!process.env.AWS_SECRET_ACCESS_KEY) errors.push('AWS_SECRET_ACCESS_KEY é obrigatório para S3');
    if (!process.env.AWS_S3_BUCKET_NAME) errors.push('AWS_S3_BUCKET_NAME é obrigatório para S3');
  }

  if (storageType === 'drive') {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) errors.push('GOOGLE_APPLICATION_CREDENTIALS é obrigatório para Google Drive');
    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) errors.push('GOOGLE_DRIVE_FOLDER_ID é obrigatório para Google Drive');
  }

  return {
    valid: errors.length === 0,
    errors,
    config
  };
}

// Valida ao carregar o módulo
if (typeof window === 'undefined') {
  const validation = validateEnv();
  if (!validation.valid && process.env.NODE_ENV === 'production') {
    console.error('⚠️  Erros de configuração:', validation.errors);
  }
}

