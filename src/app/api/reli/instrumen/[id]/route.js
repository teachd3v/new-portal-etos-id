import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reli_instrumen } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const { id: itemId } = await params;
    const user = await getAuthUser(req);
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      kode, dimensi, subdimensi, judul,
      pernyataan_self, pernyataan_fasil,
      bar_level_1, bar_level_2, bar_level_3, bar_level_4
    } = body;

    const updateData = {};
    if (kode !== undefined) updateData.kode = kode;
    if (dimensi !== undefined) updateData.dimensi = dimensi;
    if (subdimensi !== undefined) updateData.subdimensi = subdimensi;
    if (judul !== undefined) updateData.judul = judul;
    if (pernyataan_self !== undefined) updateData.pernyataan_self = pernyataan_self;
    if (pernyataan_fasil !== undefined) updateData.pernyataan_fasil = pernyataan_fasil;
    if (bar_level_1 !== undefined) updateData.bar_level_1 = bar_level_1;
    if (bar_level_2 !== undefined) updateData.bar_level_2 = bar_level_2;
    if (bar_level_3 !== undefined) updateData.bar_level_3 = bar_level_3;
    if (bar_level_4 !== undefined) updateData.bar_level_4 = bar_level_4;

    await db.update(reli_instrumen)
      .set(updateData)
      .where(eq(reli_instrumen.id, itemId));

    return NextResponse.json({ success: true, message: 'Butir instrumen RELI berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating RELI item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id: itemId } = await params;
    const user = await getAuthUser(req);
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.delete(reli_instrumen).where(eq(reli_instrumen.id, itemId));

    return NextResponse.json({ success: true, message: 'Butir instrumen RELI berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting RELI item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
