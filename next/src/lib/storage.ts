/**
 * Serviço de armazenamento de fotos
 * Suporta: Vercel Blob, AWS S3, Google Drive, ou armazenamento local
 */

export interface StorageResult {
  url?: string;
  fileId?: string;
  path?: string;
  success: boolean;
  error?: string;
}

export interface StorageProvider {
  upload(buffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult>;
}

// Vercel Blob Storage (Recomendado para produção)
async function uploadToVercelBlob(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<StorageResult> {
  try {
    const { put } = await import('@vercel/blob');
    const blob = await put(fileName, buffer, {
      access: 'public',
      contentType: mimeType,
    });
    return {
      success: true,
      url: blob.url,
      fileId: blob.url,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao fazer upload para Vercel Blob',
    };
  }
}

// AWS S3 Storage
async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<StorageResult> {
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME não configurado');
    }

    const key = `photos/${fileName}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'public-read',
      })
    );

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
    return {
      success: true,
      url,
      fileId: key,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao fazer upload para S3',
    };
  }
}

// Google Drive (já existente, adaptado)
async function uploadToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<StorageResult> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { uploadToDrive } = await import('./drive');
    
    // Cria arquivo temporário
    const tempDir = path.join(process.cwd(), 'data', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempPath = path.join(tempDir, fileName);
    fs.writeFileSync(tempPath, buffer);
    
    try {
      const driveFileId = await uploadToDrive(tempPath, fileName);
      // Remove arquivo temporário
      fs.unlinkSync(tempPath);
      
      if (driveFileId) {
        return {
          success: true,
          fileId: driveFileId,
        };
      }
      return {
        success: false,
        error: 'Falha ao fazer upload para Google Drive',
      };
    } catch (error) {
      // Remove arquivo temporário em caso de erro
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw error;
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao fazer upload para Google Drive',
    };
  }
}

// Armazenamento local (fallback)
async function uploadLocal(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<StorageResult> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    const uploadsDir = path.join(dataDir, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    return {
      success: true,
      path: filePath,
      fileId: fileName,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao salvar arquivo localmente',
    };
  }
}

/**
 * Faz upload da foto usando o provider configurado
 */
export async function uploadPhoto(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<StorageResult> {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType) {
    case 'vercel-blob':
      return uploadToVercelBlob(buffer, fileName, mimeType);
    
    case 's3':
      return uploadToS3(buffer, fileName, mimeType);
    
    case 'drive':
      return uploadToDrive(buffer, fileName, mimeType);
    
    case 'local':
    default:
      return uploadLocal(buffer, fileName, mimeType);
  }
}

/**
 * Retorna a URL pública da foto baseado no tipo de storage
 */
export function getPhotoUrl(fileId: string | null, path?: string): string | null {
  if (!fileId && !path) return null;
  
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  switch (storageType) {
    case 'vercel-blob':
      return fileId || null;
    
    case 's3':
      if (fileId) {
        const bucketName = process.env.AWS_S3_BUCKET_NAME;
        const region = process.env.AWS_REGION || 'us-east-1';
        return `https://${bucketName}.s3.${region}.amazonaws.com/${fileId}`;
      }
      return null;
    
    case 'drive':
      // Google Drive requer autenticação para acessar, então retorna null
      // Você pode implementar um endpoint para servir as fotos do Drive
      return null;
    
    case 'local':
    default:
      // Para local, você precisaria criar um endpoint para servir as fotos
      // Por enquanto retorna null
      return null;
  }
}

