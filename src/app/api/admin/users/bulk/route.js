import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { sql, inArray } from 'drizzle-orm';

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
    const url = new URL(req.url);
    const checkOnly = url.searchParams.get('check_only') === 'true';

    const usersArray = await req.json();
    
    if (!Array.isArray(usersArray) || usersArray.length === 0) {
      return NextResponse.json({ error: 'Data invalid atau kosong' }, { status: 400 });
    }

    // Prepare data for insertion (handling empty fields)
    const valuesToInsert = usersArray.map(user => ({
      id: user.id.trim(),
      name: toTitleCase(user.name),
      role: user.role.trim(),
      password: (user.password && user.password.trim() !== '') ? user.password.trim() : null,
      angkatan: (user.angkatan && user.angkatan.trim() !== '') ? user.angkatan.trim() : '-',
      wilayah: (user.wilayah && user.wilayah.trim() !== '') ? user.wilayah.trim() : 'Pusat',
      tahun_pembinaan: (user.tahun_pembinaan && user.tahun_pembinaan.trim() !== '') ? user.tahun_pembinaan.trim() : null,
      fase: (user.fase && user.fase.trim() !== '') ? user.fase.trim().toUpperCase() : (user.role.trim() === 'Etoser' || user.role.trim() === 'PM' ? 'T0' : null),
      fasil_role: (user.fasil_role && user.fasil_role.trim() !== '') ? user.fasil_role.trim() : null,
    }));

    if (checkOnly) {
      const ids = valuesToInsert.map(v => v.id);
      let existingCount = 0;
      const idChunkSize = 500;
      for (let i = 0; i < ids.length; i += idChunkSize) {
        const chunkIds = ids.slice(i, i + idChunkSize);
        const existing = await db.select({ id: users.id }).from(users).where(inArray(users.id, chunkIds));
        existingCount += existing.length;
      }
      return NextResponse.json({ existingCount });
    }

    // SQLite has a limit of 999 parameters per query. 
    // We have 10 columns per row, so max rows per insert is 99. We'll chunk by 50.
    const chunkSize = 50;
    for (let i = 0; i < valuesToInsert.length; i += chunkSize) {
      const chunk = valuesToInsert.slice(i, i + chunkSize);
      await db.insert(users).values(chunk).onConflictDoUpdate({
        target: users.id,
        set: {
          name: sql`excluded.name`,
          role: sql`excluded.role`,
          password: sql`excluded.password`,
          angkatan: sql`excluded.angkatan`,
          wilayah: sql`excluded.wilayah`,
          tahun_pembinaan: sql`excluded.tahun_pembinaan`,
          fase: sql`excluded.fase`,
          fasil_role: sql`excluded.fasil_role`
        }
      });
    }


    return NextResponse.json({ success: true, count: valuesToInsert.length });
  } catch (error) {
    console.error('Bulk insert error:', error);
    // If it's a unique constraint error (e.g. ID already exists)
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Salah satu ID sudah terdaftar di sistem.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
