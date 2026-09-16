import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, agendas, katalog_sanksi, reli_instrumen, reli_consolidated, periode_penilaian } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch base data
    const allUsers = await db.select().from(users);
    const allAgendas = await db.select().from(agendas);
    const allSanksi = await db.select().from(katalog_sanksi);
    const allInstReli = await db.select().from(reli_instrumen);

    // Grouping
    const etoserUsers = allUsers.filter(u => u.role?.toUpperCase() === 'PM' || u.role?.toUpperCase() === 'ETOSER');
    const fasilUsers = allUsers.filter(u => u.role?.toUpperCase().includes('FASIL'));

    // Aggregate Etoser by Wilayah
    const etoserByWilayahMap = {};
    etoserUsers.forEach(u => {
      const wilayah = u.wilayah || 'Belum Diatur';
      etoserByWilayahMap[wilayah] = (etoserByWilayahMap[wilayah] || 0) + 1;
    });
    const etoserByWilayah = Object.entries(etoserByWilayahMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Active RELI Period & Consolidated RELI data
    const openPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        eq(periode_penilaian.tipe_instrumen, 'RELI')
      )
    );
    const activePeriod = openPeriods[0] || null;
    const activeKode = activePeriod?.kode_periode || 'T0';

    const consolidatedData = await db.select().from(reli_consolidated).where(eq(reli_consolidated.periode_kode, activeKode));

    let avgReli = 0;
    let avgVR = 0;
    let avgSR = 0;
    let avgSoR = 0;
    let avgCR = 0;

    const maturityCounts = {
      'Emerging Leader': 0,
      'Developing Leader': 0,
      'Transformative Leader': 0,
      'Resilient Leader': 0
    };

    const gapCounts = {
      'Selaras': 0,
      'Perlu refleksi': 0,
      'Significant Awareness Gap': 0,
      'Critical Awareness Gap': 0
    };

    if (consolidatedData.length > 0) {
      let sumReli = 0;
      let sumVR = 0;
      let sumSR = 0;
      let sumSoR = 0;
      let sumCR = 0;
      let countDims = 0;

      for (const row of consolidatedData) {
        if (typeof row.final_reli === 'number') sumReli += row.final_reli;
        if (row.maturity_level && maturityCounts[row.maturity_level] !== undefined) {
          maturityCounts[row.maturity_level]++;
        }
        if (row.gap_category && gapCounts[row.gap_category] !== undefined) {
          gapCounts[row.gap_category]++;
        }

        if (row.dimensions_json) {
          try {
            const dims = JSON.parse(row.dimensions_json);
            if (dims['Value Resilience']?.final) sumVR += dims['Value Resilience'].final;
            if (dims['Self Resilience']?.final) sumSR += dims['Self Resilience'].final;
            if (dims['Social Resilience']?.final) sumSoR += dims['Social Resilience'].final;
            if (dims['Change Resilience']?.final) sumCR += dims['Change Resilience'].final;
            countDims++;
          } catch(e){}
        }
      }

      avgReli = Math.round((sumReli / consolidatedData.length) * 100) / 100;
      if (countDims > 0) {
        avgVR = Math.round((sumVR / countDims) * 100) / 100;
        avgSR = Math.round((sumSR / countDims) * 100) / 100;
        avgSoR = Math.round((sumSoR / countDims) * 100) / 100;
        avgCR = Math.round((sumCR / countDims) * 100) / 100;
      }
    }

    const maturityDistribution = Object.entries(maturityCounts).map(([name, count]) => ({ name, count }));
    const gapDistribution = Object.entries(gapCounts).map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      stats: {
        totalEtoser: etoserUsers.length,
        totalFasil: fasilUsers.length,
        totalAgendas: allAgendas.length,
        totalSanksi: allSanksi.length,
        totalInstrumen: allInstReli.length,
        activePeriod,
        assessedCount: consolidatedData.length,
        avgReli,
        dimensions: {
          vr: avgVR,
          sr: avgSR,
          sor: avgSoR,
          cr: avgCR
        }
      },
      charts: {
        etoserByWilayah,
        maturityDistribution,
        gapDistribution,
        radarDimensions: [
          { subject: 'Value Resilience', A: avgVR, fullMark: 4 },
          { subject: 'Self Resilience', A: avgSR, fullMark: 4 },
          { subject: 'Social Resilience', A: avgSoR, fullMark: 4 },
          { subject: 'Change Resilience', A: avgCR, fullMark: 4 }
        ]
      }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

