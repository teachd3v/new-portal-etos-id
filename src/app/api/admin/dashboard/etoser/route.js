import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, reli_consolidated, reli_assessments, periode_penilaian, sanksi_user, katalog_sanksi } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const wilayah = searchParams.get('wilayah') || 'all';
    const angkatan = searchParams.get('angkatan') || 'all';

    // 1. Fetch Etoser Users
    const allUsers = await db.select().from(users);
    let etosers = allUsers.filter(u => u.role?.toUpperCase() === 'ETOSER' || u.role?.toUpperCase() === 'PM');
    if (wilayah !== 'all') etosers = etosers.filter(u => u.wilayah === wilayah);
    if (angkatan !== 'all') etosers = etosers.filter(u => u.angkatan === angkatan);
    
    const etoserIds = etosers.map(e => e.id);

    // 2. Fetch Active RELI Period
    const openPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        eq(periode_penilaian.tipe_instrumen, 'RELI')
      )
    );
    const activePeriod = openPeriods[0] || null;
    const activeKode = activePeriod?.kode_periode || 'T0';

    // 3. Fetch Consolidated & Raw Assessments for Active Period
    const activeConsolidated = await db.select().from(reli_consolidated).where(eq(reli_consolidated.periode_kode, activeKode));
    const activeSelfAssessments = await db.select().from(reli_assessments).where(
      and(
        eq(reli_assessments.periode_kode, activeKode),
        eq(reli_assessments.evaluator_type, 'SELF')
      )
    );
    const activeFacilAssessments = await db.select().from(reli_assessments).where(
      and(
        eq(reli_assessments.periode_kode, activeKode),
        eq(reli_assessments.evaluator_type, 'FACILITATOR')
      )
    );

    const selfFilledUserIds = new Set(activeSelfAssessments.map(a => a.user_id));
    const facilFilledUserIds = new Set(activeFacilAssessments.map(a => a.user_id));

    // 4. Fetch Sanksi
    const allSanksiUser = await db.select().from(sanksi_user);
    const allKatalogSanksi = await db.select().from(katalog_sanksi);
    const activeSanksi = allSanksiUser.filter(s => etoserIds.includes(s.user_id));
    const etoserKenaSanksi = new Set(activeSanksi.map(s => s.user_id)).size;

    const sanksiTable = activeSanksi.map(s => {
      const etoserUser = allUsers.find(u => u.id === s.user_id);
      const catalogItem = allKatalogSanksi.find(k => k.id === s.katalog_sanksi_id);
      return {
        id: s.id,
        etoserId: s.user_id,
        etoserName: etoserUser?.name || 'Etoser',
        wilayah: etoserUser?.wilayah || '-',
        angkatan: etoserUser?.angkatan || '-',
        poin: s.poin,
        keterangan: s.keterangan || '-',
        pelanggaran: catalogItem?.detail_pelanggaran || 'Pelanggaran',
        status: s.status
      };
    });

    // 5. Build Detail Table
    const consolidatedMap = {};
    activeConsolidated.forEach(c => { consolidatedMap[c.user_id] = c; });

    const varList = ['Value Resilience', 'Self Resilience', 'Social Resilience', 'Change Resilience'];

    const detailData = etosers.map(e => {
      const c = consolidatedMap[e.id];
      const hasSelf = selfFilledUserIds.has(e.id);
      const hasFacil = facilFilledUserIds.has(e.id);

      let statusList = [];
      if (hasSelf) statusList.push('Self: Terisi');
      else statusList.push('Self: Belum');

      if (hasFacil) statusList.push('Fasil: Terisi');
      else statusList.push('Fasil: Belum');

      let dims = {};
      if (c && c.dimensions_json) {
        try {
          dims = JSON.parse(c.dimensions_json);
        } catch(err){}
      }

      const varScores = {
        'Value Resilience': dims['Value Resilience']?.final ?? 0,
        'Self Resilience': dims['Self Resilience']?.final ?? 0,
        'Social Resilience': dims['Social Resilience']?.final ?? 0,
        'Change Resilience': dims['Change Resilience']?.final ?? 0,
      };

      return {
        id: e.id,
        name: e.name,
        wilayah: e.wilayah || '-',
        angkatan: e.angkatan || '-',
        status: statusList.join(', '),
        variables: varScores,
        finalReli: c ? c.final_reli : null,
        ipk: c ? c.final_reli.toFixed(2) : '0.00',
        gapScore: c ? c.gap_score : null,
        gapCategory: c ? c.gap_category : null,
        kategoriIpk: c ? c.maturity_level : 'Belum Asesmen',
        maturityLevel: c ? c.maturity_level : 'Belum Asesmen',
        growthDelta: c ? c.growth_delta : null,
        hasSelf,
        hasFacil
      };
    });

    // Sort: complete first, then by name
    detailData.sort((a, b) => {
      if (a.hasSelf && a.hasFacil && !(b.hasSelf && b.hasFacil)) return -1;
      if (!(a.hasSelf && a.hasFacil) && b.hasSelf && b.hasFacil) return 1;
      return a.name.localeCompare(b.name);
    });

    // 6. National Dimension Averages for Radar Chart
    let sumVR = 0, sumSR = 0, sumSoR = 0, sumCR = 0, countDims = 0;
    activeConsolidated.forEach(c => {
      if (c.dimensions_json) {
        try {
          const d = JSON.parse(c.dimensions_json);
          if (d['Value Resilience']?.final) sumVR += d['Value Resilience'].final;
          if (d['Self Resilience']?.final) sumSR += d['Self Resilience'].final;
          if (d['Social Resilience']?.final) sumSoR += d['Social Resilience'].final;
          if (d['Change Resilience']?.final) sumCR += d['Change Resilience'].final;
          countDims++;
        } catch(err){}
      }
    });

    const sebaranVariabel = [
      { subject: 'Value Resilience', A: countDims > 0 ? Math.round((sumVR / countDims) * 100) / 100 : 0, fullMark: 4 },
      { subject: 'Self Resilience', A: countDims > 0 ? Math.round((sumSR / countDims) * 100) / 100 : 0, fullMark: 4 },
      { subject: 'Social Resilience', A: countDims > 0 ? Math.round((sumSoR / countDims) * 100) / 100 : 0, fullMark: 4 },
      { subject: 'Change Resilience', A: countDims > 0 ? Math.round((sumCR / countDims) * 100) / 100 : 0, fullMark: 4 },
    ];

    // Trajectory History for Cohort
    const allConsolidated = await db.select().from(reli_consolidated);
    const periodsList = ['T0', 'T1', 'T2', 'T3', 'T4'];
    const trendIpk = periodsList.map(pKode => {
      const rows = allConsolidated.filter(c => c.periode_kode === pKode);
      let avgScore = 0;
      if (rows.length > 0) {
        const sum = rows.reduce((acc, c) => acc + c.final_reli, 0);
        avgScore = Math.round((sum / rows.length) * 100) / 100;
      }
      return {
        month: pKode,
        ipk_rerata: avgScore,
        count: rows.length
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalEtoser: etosers.length,
        etoserMengisi: selfFilledUserIds.size,
        fasilMenilai: facilFilledUserIds.size,
        etoserKenaSanksi,
        activePeriod
      },
      sanksiTable,
      charts: {
        trendIpk,
        sebaranVariabel,
        variables: varList
      },
      table: detailData
    });

  } catch (error) {
    console.error('Admin Etoser Dashboard API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

