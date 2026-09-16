import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, periode_penilaian, reli_assessments, reli_consolidated } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user || (!user.role?.toUpperCase().includes('FASIL') && user.role?.toUpperCase() !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Get Fasil data
    const fasilRecords = await db.select().from(users).where(eq(users.id, user.id));
    if (!fasilRecords.length) return NextResponse.json({ error: 'Fasil not found' }, { status: 404 });
    const fasil = fasilRecords[0];

    // 2. Fetch Active RELI Period
    const openPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        eq(periode_penilaian.tipe_instrumen, 'RELI')
      )
    );
    const activePeriod = openPeriods[0] || null;
    const periodeKode = activePeriod?.kode_periode || 'T0';

    // 3. Get Etosers based on relasi_etoser or fallback to Wilayah
    let etosers = [];
    if (fasil.relasi_etoser && fasil.relasi_etoser.trim() !== '') {
      const relasiIds = fasil.relasi_etoser.split(',').map(id => id.trim()).filter(id => id !== '');
      if (relasiIds.length > 0) {
        etosers = await db.select({
          id: users.id,
          name: users.name,
          angkatan: users.angkatan,
          wilayah: users.wilayah,
          tahun_pembinaan: users.tahun_pembinaan,
          fase: users.fase
        }).from(users).where(
          and(
            inArray(users.role, ['PM', 'Etoser', 'ETOSER']),
            inArray(users.id, relasiIds)
          )
        );
      }
    } 

    if (etosers.length === 0 && fasil.wilayah) {
      etosers = await db.select({
        id: users.id,
        name: users.name,
        angkatan: users.angkatan,
        wilayah: users.wilayah,
        tahun_pembinaan: users.tahun_pembinaan,
        fase: users.fase
      }).from(users).where(

        and(
          inArray(users.role, ['PM', 'Etoser', 'ETOSER']),
          eq(users.wilayah, fasil.wilayah)
        )
      );
    }

    // 4. Get assessment & consolidated statuses
    let assessedMap = {};
    if (activePeriod && etosers.length > 0) {
      const etoserIds = etosers.map(e => e.id);
      
      const facilAssessments = await db.select().from(reli_assessments).where(
        and(
          eq(reli_assessments.evaluator_type, 'FACILITATOR'),
          eq(reli_assessments.periode_kode, periodeKode),
          inArray(reli_assessments.user_id, etoserIds)
        )
      );

      const selfAssessments = await db.select().from(reli_assessments).where(
        and(
          eq(reli_assessments.evaluator_type, 'SELF'),
          eq(reli_assessments.periode_kode, periodeKode),
          inArray(reli_assessments.user_id, etoserIds)
        )
      );

      const consolidatedList = await db.select().from(reli_consolidated).where(
        and(
          eq(reli_consolidated.periode_kode, periodeKode),
          inArray(reli_consolidated.user_id, etoserIds)
        )
      );

      for (const e of etosers) {
        const hasFacil = facilAssessments.some(f => f.user_id === e.id);
        const hasSelf = selfAssessments.some(s => s.user_id === e.id);
        const cons = consolidatedList.find(c => c.user_id === e.id);

        assessedMap[e.id] = {
          hasSelf,
          hasFacil,
          finalReli: cons?.final_reli ?? null,
          gapScore: cons?.gap_score ?? null,
          gapCategory: cons?.gap_category ?? null,
          maturityLevel: cons?.maturity_level ?? '-'
        };
      }
    }

    // 5. Structure response
    const data = etosers.map(e => ({
      ...e,
      isAssessed: assessedMap[e.id]?.hasFacil ?? false,
      hasSelfAssessed: assessedMap[e.id]?.hasSelf ?? false,
      finalReli: assessedMap[e.id]?.finalReli ?? null,
      gapScore: assessedMap[e.id]?.gapScore ?? null,
      gapCategory: assessedMap[e.id]?.gapCategory ?? null,
      maturityLevel: assessedMap[e.id]?.maturityLevel ?? '-'
    }));

    return NextResponse.json({ 
      success: true, 
      activePeriod,
      data 
    });
  } catch (error) {
    console.error("Penilaian RELI Fasil List Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

