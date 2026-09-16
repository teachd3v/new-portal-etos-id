import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, profil_user, reli_instrumen, reli_assessments, reli_consolidated, catatan_admin, periode_penilaian } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const authUser = await getAuthUser(req);
    if (!authUser || (authUser.role?.toUpperCase() !== 'ADMIN' && !authUser.role?.toUpperCase().includes('FASIL'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch User and Profile
    const userList = await db.select().from(users).where(eq(users.id, id));
    if (userList.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }
    const user = userList[0];

    const profileList = await db.select().from(profil_user).where(eq(profil_user.id, id));
    const profile = profileList[0] || {};

    // 2. Fetch Active RELI Period
    const openPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        eq(periode_penilaian.tipe_instrumen, 'RELI')
      )
    );
    const activePeriod = openPeriods[0] || null;
    const activeKode = activePeriod?.kode_periode || 'T0';

    // 3. Fetch all Consolidated RELI (T0-T4)
    const consolidatedList = await db.select().from(reli_consolidated)
      .where(eq(reli_consolidated.user_id, id))
      .orderBy(asc(reli_consolidated.periode_kode));

    const trajectoryMap = {};
    for (const c of consolidatedList) {
      trajectoryMap[c.periode_kode] = {
        periode: c.periode_kode,
        final_reli: c.final_reli,
        self_score: c.self_score,
        facil_score: c.facil_score,
        gap_score: c.gap_score,
        gap_category: c.gap_category,
        maturity_level: c.maturity_level,
        dimensions: c.dimensions_json ? JSON.parse(c.dimensions_json) : null,
        subdimensions: c.subdimensions_json ? JSON.parse(c.subdimensions_json) : null,
        growth_delta: c.growth_delta,
        growth_rate: c.growth_rate
      };
    }

    const trajectory = ['T0', 'T1', 'T2', 'T3', 'T4'].map(k => ({
      periode: k,
      score: trajectoryMap[k]?.final_reli ?? null,
      selfScore: trajectoryMap[k]?.self_score ?? null,
      facilScore: trajectoryMap[k]?.facil_score ?? null,
      gapScore: trajectoryMap[k]?.gap_score ?? null,
      gapCategory: trajectoryMap[k]?.gap_category ?? null,
      maturity: trajectoryMap[k]?.maturity_level ?? '-'
    }));

    // Active or latest consolidated
    const currentConsolidated = trajectoryMap[activeKode] || (consolidatedList.length > 0 ? trajectoryMap[consolidatedList[consolidatedList.length - 1].periode_kode] : null);

    // 4. Fetch 64 Instruments & Detailed Answer Comparison for Active Period
    const instruments = await db.select().from(reli_instrumen).orderBy(asc(reli_instrumen.order_num));

    const activeSelf = await db.select().from(reli_assessments).where(
      and(
        eq(reli_assessments.user_id, id),
        eq(reli_assessments.evaluator_type, 'SELF'),
        eq(reli_assessments.periode_kode, activeKode)
      )
    );
    const selfAnswers = activeSelf[0]?.raw_answers ? JSON.parse(activeSelf[0].raw_answers) : {};

    const activeFacil = await db.select().from(reli_assessments).where(
      and(
        eq(reli_assessments.user_id, id),
        eq(reli_assessments.evaluator_type, 'FACILITATOR'),
        eq(reli_assessments.periode_kode, activeKode)
      )
    );
    const facilAnswers = activeFacil[0]?.raw_answers ? JSON.parse(activeFacil[0].raw_answers) : {};

    const itemDetails = instruments.map(inst => {
      const sVal = selfAnswers[inst.kode] ?? null;
      const fVal = facilAnswers[inst.kode] ?? null;
      const gap = (sVal !== null && fVal !== null) ? Math.round((sVal - fVal) * 100) / 100 : null;
      return {
        id: inst.id,
        kode: inst.kode,
        dimensi: inst.dimensi,
        subdimensi: inst.subdimensi,
        judul: inst.judul,
        pernyataan_self: inst.pernyataan_self,
        pernyataan_fasil: inst.pernyataan_fasil,
        bar_level_1: inst.bar_level_1,
        bar_level_2: inst.bar_level_2,
        bar_level_3: inst.bar_level_3,
        bar_level_4: inst.bar_level_4,
        selfScore: sVal,
        facilScore: fVal,
        gap
      };
    });

    // 5. Fetch Admin Note
    const adminNotes = await db.select().from(catatan_admin).where(
      and(
        eq(catatan_admin.target_user_id, id),
        eq(catatan_admin.period_month, activeKode)
      )
    );
    const currentNote = adminNotes[0]?.catatan || '';

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        angkatan: user.angkatan || '-',
        wilayah: user.wilayah || '-',
        tahun_pembinaan: user.tahun_pembinaan || '-',
        fase: user.fase || 'T0',
        universitas: profile.universitas || '-',

        fakultas: profile.fakultas || '-',
        jurusan: profile.jurusan || '-',
        semester: profile.semester_berjalan || '-',
        ipk_terakhir: profile.ipk_terakhir || 0,
      },
      activePeriod,
      reli: {
        activeKode,
        current: currentConsolidated,
        trajectory,
        itemDetails
      },
      catatanAdmin: currentNote
    });

  } catch (error) {
    console.error('Fetch RELI Etoser Details Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

