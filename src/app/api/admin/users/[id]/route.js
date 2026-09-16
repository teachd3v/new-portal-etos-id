import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function toTitleCase(str) {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Only update password if provided
    const updateData = {
      name: toTitleCase(body.name),
      role: body.role,
      angkatan: body.angkatan || '-',
      wilayah: body.wilayah || 'Pusat',
      tahun_pembinaan: body.tahun_pembinaan || null,
      fase: body.fase !== undefined ? body.fase : null,
      fasil_role: body.fasil_role || null,
      relasi_etoser: body.relasi_etoser || null,
    };

    if (body.password && body.password.trim() !== '') {
      updateData.password = body.password;
    }

    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
      
    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
