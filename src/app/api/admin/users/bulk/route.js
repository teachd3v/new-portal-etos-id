import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { sql, inArray } from 'drizzle-orm';

function toTitleCase(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeFase(faseStr, role) {
  if (!faseStr || typeof faseStr !== 'string' || faseStr.trim() === '') {
    return (role === 'Etoser' || role === 'PM') ? 'T0' : null;
  }
  const clean = faseStr.trim().toUpperCase();
  if (clean.includes('T0') || clean.includes('TO') || clean.includes('BASELINE')) return 'T0';
  if (clean.includes('T1')) return 'T1';
  if (clean.includes('T2')) return 'T2';
  if (clean.includes('T3')) return 'T3';
  if (clean.includes('T4') || clean.includes('ENDLINE')) return 'T4';
  const match = clean.match(/T[0-4]/);
  if (match) return match[0];
  return clean;
}

export async function POST(req) {
  try {
    const url = new URL(req.url);
    const checkOnly = url.searchParams.get('check_only') === 'true';

    const usersArray = await req.json();
    
    if (!Array.isArray(usersArray) || usersArray.length === 0) {
      return NextResponse.json({ error: 'Data invalid atau kosong' }, { status: 400 });
    }

    // Prepare data for insertion (defensive against numbers/undefined/empty spaces)
    const valuesToInsert = usersArray
      .map(user => {
        const rawId = String(user.id ?? '').trim();
        const rawName = String(user.name ?? '').trim();
        const rawRole = String(user.role ?? 'Etoser').trim();
        const rawPassword = String(user.password ?? '').trim();
        const rawAngkatan = String(user.angkatan ?? '').trim();
        const rawWilayah = String(user.wilayah ?? '').trim();
        const rawTahunPembinaan = String(user.tahun_pembinaan ?? '').trim();
        const rawFase = String(user.fase ?? '').trim();
        const rawFasilRole = String(user.fasil_role ?? '').trim();

        let role = rawRole;
        if (role.toLowerCase() === 'etoser' || role.toLowerCase() === 'pm') role = 'Etoser';
        else if (role.toLowerCase().includes('fasil')) role = 'Fasil';
        else if (role.toLowerCase() === 'admin') role = 'Admin';

        return {
          id: rawId,
          name: toTitleCase(rawName),
          role: role,
          password: rawPassword !== '' ? rawPassword : null,
          angkatan: rawAngkatan !== '' ? rawAngkatan : '-',
          wilayah: rawWilayah !== '' ? rawWilayah : 'Pusat',
          tahun_pembinaan: rawTahunPembinaan !== '' ? rawTahunPembinaan : null,
          fase: normalizeFase(rawFase, role),
          fasil_role: rawFasilRole !== '' ? rawFasilRole : null,
        };
      })
      .filter(u => u.id && u.id.length > 0);

    if (valuesToInsert.length === 0) {
      return NextResponse.json({ error: 'Tidak ada baris data dengan ID yang valid untuk diproses.' }, { status: 400 });
    }

    if (checkOnly) {
      const ids = valuesToInsert.map(v => v.id);
      let existingCount = 0;
      // Cloudflare D1 has a hard limit of 100 SQL variables per query
      const idChunkSize = 50;
      for (let i = 0; i < ids.length; i += idChunkSize) {
        const chunkIds = ids.slice(i, i + idChunkSize);
        if (chunkIds.length > 0) {
          const existing = await db.select({ id: users.id }).from(users).where(inArray(users.id, chunkIds));
          existingCount += existing.length;
        }
      }
      return NextResponse.json({ existingCount });
    }

    // Cloudflare D1 max bound parameters is 100.
    // Each row has 9 columns -> chunkSize = 8 produces 72 variables, perfectly within D1 limits.
    const chunkSize = 8;
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
    const msg = error?.message || '';
    if (msg.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Salah satu ID sudah terdaftar di sistem.' }, { status: 400 });
    }
    if (msg.includes('too many SQL variables')) {
      return NextResponse.json({ error: 'Ukuran batch melebihi batas variabel database D1.' }, { status: 500 });
    }
    return NextResponse.json({ error: msg.length > 200 ? msg.slice(0, 200) + '...' : msg }, { status: 500 });
  }
}
