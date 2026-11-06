import { NextResponse } from 'next/server';
import { db } from '@/db';
import { portofolio } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await db
      .select()
      .from(portofolio)
      .where(eq(portofolio.user_id, authUser.id))
      .orderBy(desc(portofolio.tahun));

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { kategori, judul_karya, tahun, deskripsi_singkat, link_bukti } = body;

    const id = `POR-${Date.now()}`;

    await db.insert(portofolio).values({
      id,
      user_id: authUser.id,
      kategori,
      judul_karya,
      tahun,
      deskripsi_singkat,
      link_bukti,
    });

    return NextResponse.json({ success: true, message: 'Portofolio berhasil ditambahkan' }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 });
    }

    await db
      .delete(portofolio)
      .where(and(eq(portofolio.id, id), eq(portofolio.user_id, authUser.id)));

    return NextResponse.json({ success: true, message: 'Portofolio berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
