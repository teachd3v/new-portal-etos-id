import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    return NextResponse.json(allUsers);
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

export async function POST(req) {
  try {
    const body = await req.json();
    const hashedPassword = body.password ? await hashPassword(body.password) : null;
    const newUser = await db.insert(users).values({
      id: body.id,
      name: toTitleCase(body.name),
      role: body.role,
      password: hashedPassword,
      angkatan: body.angkatan || '-',
      wilayah: body.wilayah || 'Pusat',
      tahun_pembinaan: body.tahun_pembinaan || null,
      fase: body.fase || (body.role === 'Etoser' || body.role === 'PM' ? 'T0' : null),
      fasil_role: body.fasil_role || null,
      relasi_etoser: body.relasi_etoser || null,
    }).returning();
    return NextResponse.json(newUser[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



export async function DELETE(req) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }
    await db.delete(users).where(inArray(users.id, ids));
    return NextResponse.json({ message: "Bulk delete successful" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
