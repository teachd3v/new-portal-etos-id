import { NextResponse } from 'next/server';
import { db } from '@/db';
import { portofolio } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJwt } from '@/lib/auth';

export async function GET(req) {
  try {
    const tokenCookie = req.cookies.get('auth_token');
    let userId = 'E2023019'; 

    if (tokenCookie && tokenCookie.value) {
      const payload = await verifyJwt(tokenCookie.value);
      if (payload) {
        userId = payload.id;
      }
    }

    const items = await db.select().from(portofolio).where(eq(portofolio.user_id, userId));

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const tokenCookie = req.cookies.get('auth_token');
    let userId = 'E2023019'; 

    if (tokenCookie && tokenCookie.value) {
      const payload = await verifyJwt(tokenCookie.value);
      if (payload) {
        userId = payload.id;
      }
    }

    const body = await req.json();
    const { kategori, judul_karya, tahun, deskripsi_singkat, link_bukti } = body;

    const id = `POR-${Date.now()}`;
    
    await db.insert(portofolio).values({
      id,
      user_id: userId,
      kategori,
      judul_karya,
      tahun,
      deskripsi_singkat,
      link_bukti
    });

    return NextResponse.json({ success: true, message: 'Portofolio berhasil ditambahkan' }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 });
    }

    await db.delete(portofolio).where(eq(portofolio.id, id));

    return NextResponse.json({ success: true, message: 'Portofolio berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
