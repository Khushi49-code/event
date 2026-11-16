// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminStorage, getUidFromRequest } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
];

export async function POST(req: NextRequest) {
  try {
    // 🔥 Fakt logged-in user j upload kari shake
    await getUidFromRequest(req);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawPath = formData.get('path') as string | null;

    if (!file || !rawPath) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 });
    }

    // Path safe karo: leading "/" ane ".." kadhi nakho
    const path = rawPath.replace(/^\/+/, '').replace(/\.\.+/g, '');
    if (!path) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(path);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });

    await fileRef.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('Upload error:', error);

    const unauthorized = error?.message === 'Unauthorized' || error?.code?.startsWith?.('auth/');
    return NextResponse.json(
      { error: unauthorized ? 'Unauthorized' : error.message || 'Upload failed' },
      { status: unauthorized ? 401 : 500 }
    );
  }
}