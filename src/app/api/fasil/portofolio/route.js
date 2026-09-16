import { NextResponse } from 'next/server';
import { db } from '@/db';
import { portofolio } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJwt } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('cookie');
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyJwt(token);
    if (!decoded || !decoded.role.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await db.select().from(portofolio).where(eq(portofolio.user_id, decoded.id));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('cookie');
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = await verifyJwt(token);
    if (!decoded || !decoded.role.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { kategori, judul_karya, tahun, deskripsi_singkat, link_bukti } = body;

    if (!kategori || !judul_karya || !tahun) {
      return NextResponse.json({ error: 'Kategori, Judul, dan Tahun wajib diisi.' }, { status: 400 });
    }

    const id = `PRT-${crypto.randomBytes(4).toString('hex')}`;
    await db.insert(portofolio).values({
      id,
      user_id: decoded.id,
      kategori,
      judul_karya,
      tahun,
      deskripsi_singkat: deskripsi_singkat || '',
      link_bukti: link_bukti || ''
    });

    return NextResponse.json({ success: true, message: 'Portofolio berhasil ditambahkan.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
