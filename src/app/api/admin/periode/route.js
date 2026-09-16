import { NextResponse } from 'next/server';
import { db } from '@/db';
import { periode_penilaian } from '@/db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

const DEFAULT_PERIODS = [
  { kode_periode: 'T0', label: 'T0 - Baseline (Awal Masuk Tahun 1)', start_date: '2026-09-01', end_date: '2026-09-30', is_open: true },
  { kode_periode: 'T1', label: 'T1 - Evaluasi Akhir Tahun 1 (Year 1 Endline)', start_date: '2027-06-01', end_date: '2027-06-30', is_open: false },
  { kode_periode: 'T2', label: 'T2 - Evaluasi Akhir Tahun 2 (Year 2 Endline)', start_date: '2028-06-01', end_date: '2028-06-30', is_open: false },
  { kode_periode: 'T3', label: 'T3 - Evaluasi Akhir Tahun 3 (Year 3 Endline)', start_date: '2029-06-01', end_date: '2029-06-30', is_open: false },
  { kode_periode: 'T4', label: 'T4 - Final Endline (Kelulusan Pembinaan)', start_date: '2030-06-01', end_date: '2030-06-30', is_open: false },
];

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let data = await db.select().from(periode_penilaian).orderBy(asc(periode_penilaian.kode_periode));
    
    // If no periods or missing default codes, auto-seed/ensure T0-T4
    const existingKodes = new Set(data.map(p => p.kode_periode));
    const currentYear = new Date().getFullYear().toString();

    for (const def of DEFAULT_PERIODS) {
      if (!existingKodes.has(def.kode_periode)) {
        const newId = `${def.kode_periode}-${currentYear}`;
        await db.insert(periode_penilaian).values({
          id: newId,
          kode_periode: def.kode_periode,
          label: def.label,
          bulan: def.kode_periode,
          tahun: currentYear,
          start_date: def.start_date,
          end_date: def.end_date,
          angkatan: 'Semua',
          tipe_instrumen: 'RELI',
          is_open: def.is_open
        }).onConflictDoNothing();
      }
    }

    // Refresh after ensuring defaults
    data = await db.select().from(periode_penilaian).orderBy(asc(periode_penilaian.kode_periode));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


