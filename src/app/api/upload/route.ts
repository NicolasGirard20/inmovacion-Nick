import { uploadFile, getPublicUrl } from '@/lib/supabase-storage';
import { NextResponse } from 'next/server';
import { getAuthenticatedSession, unauthorizedResponse } from '@/lib/auth-guards';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const rawPropertyId = formData.get('propertyId');

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'No file uploaded' },
      { status: 400 }
    );
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de archivo no permitido. Solo imágenes (JPG, PNG, WEBP, GIF, AVIF).' },
      { status: 400 }
    );
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'El archivo excede el tamaño máximo permitido (10 MB).' },
      { status: 400 }
    );
  }

  const safeFolder =
    typeof rawPropertyId === 'string' && /^[a-zA-Z0-9_-]+$/.test(rawPropertyId)
      ? rawPropertyId
      : 'general';

  try {
    const ext = MIME_TO_EXT[file.type] ?? 'bin';
    const fileName = `${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    await uploadFile('inmuebles', fileName, file);

    const publicUrl = getPublicUrl('inmuebles', fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: fileName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}