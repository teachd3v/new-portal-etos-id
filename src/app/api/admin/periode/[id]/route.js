import { NextResponse } from 'next/server';
import { db } from '@/db';
import { periode_penilaian } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const { id: periodeId } = await params;
    
    const user = await getAuthUser(req);
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { is_open, label, angkatan, start_date, end_date, tahun } = await req.json();

    const updateData = {};
    if (typeof is_open === 'boolean') updateData.is_open = is_open;
    if (label !== undefined) updateData.label = label;
    if (angkatan !== undefined) updateData.angkatan = angkatan;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (tahun !== undefined) updateData.tahun = tahun;

    await db.update(periode_penilaian)
      .set(updateData)
      .where(eq(periode_penilaian.id, periodeId));

    return NextResponse.json({ success: true, message: 'Data periode berhasil diperbarui' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id: periodeId } = await params;
    
    const user = await getAuthUser(req);
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.delete(periode_penilaian).where(eq(periode_penilaian.id, periodeId));

    return NextResponse.json({ success: true, message: 'Periode berhasil dihapus' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

