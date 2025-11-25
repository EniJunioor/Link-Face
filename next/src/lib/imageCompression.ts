/**
 * Compressão de imagens antes do upload
 */

export interface CompressionResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

const MAX_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH || '1920');
const MAX_HEIGHT = parseInt(process.env.MAX_IMAGE_HEIGHT || '1920');
const QUALITY = parseInt(process.env.IMAGE_QUALITY || '85');

/**
 * Comprime imagem usando Sharp
 */
export async function compressImage(
  buffer: Buffer,
  mimeType: string
): Promise<CompressionResult> {
  const originalSize = buffer.length;

  try {
    const sharp = await import('sharp').catch(() => null);
    
    if (!sharp) {
      // Se Sharp não estiver disponível, retorna buffer original
      return {
        buffer,
        originalSize,
        compressedSize: originalSize,
        ratio: 1
      };
    }

    let image = sharp.default(buffer);

    // Redimensiona se necessário
    const metadata = await image.metadata();
    if (metadata.width && metadata.height) {
      if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
        image = image.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    // Comprime baseado no tipo
    let compressedBuffer: Buffer;
    
    if (mimeType.includes('png')) {
      compressedBuffer = await image
        .png({ quality: QUALITY, compressionLevel: 9 })
        .toBuffer();
    } else if (mimeType.includes('webp')) {
      compressedBuffer = await image
        .webp({ quality: QUALITY })
        .toBuffer();
    } else {
      // JPEG
      compressedBuffer = await image
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer();
    }

    const compressedSize = compressedBuffer.length;
    const ratio = compressedSize / originalSize;

    return {
      buffer: compressedBuffer,
      originalSize,
      compressedSize,
      ratio
    };
  } catch (error: any) {
    console.error('Erro ao comprimir imagem:', error);
    // Em caso de erro, retorna original
    return {
      buffer,
      originalSize,
      compressedSize: originalSize,
      ratio: 1
    };
  }
}

