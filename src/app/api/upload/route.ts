import { uploadFile, getPublicUrl } from '@/lib/supabase-storage';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const propertyId = formData.get('propertyId') as string;

  if (!file) {
    return NextResponse.json(
      { error: 'No file uploaded' },
      { status: 400 }
    );
  }

  try {
    const fileName = `${propertyId}/${Date.now()}-${file.name}`;
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