import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, profil_user, agendas, periode_penilaian, reli_assessments, reli_consolidated, app_settings, reports } from '@/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { MATURITY_LEVELS } from '@/lib/reli';


export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const etoserId = user.id;
    const userRecords = await db.select().from(users).where(eq(users.id, etoserId));
    if (!userRecords.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const userData = userRecords[0];

    // 1. Get Profile / IPK
    const profileRecords = await db.select().from(profil_user).where(eq(profil_user.id, etoserId));
    const profile = profileRecords.length > 0 ? profileRecords[0] : null;

    // 2. Check Active RELI Period
    const openPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        eq(periode_penilaian.tipe_instrumen, 'RELI')
      )
    );
    const activePeriod = openPeriods[0] || null;

    let hasFilledSelf = false;
    if (activePeriod) {
      const selfAssessments = await db.select().from(reli_assessments).where(
        and(
          eq(reli_assessments.user_id, etoserId),
          eq(reli_assessments.evaluator_type, 'SELF'),
          eq(reli_assessments.periode_kode, activePeriod.kode_periode || 'T0')
        )
      );
      hasFilledSelf = selfAssessments.length > 0;
    }

    const showPenilaianAlert = activePeriod !== null && !hasFilledSelf;

    // 2b. Check Monthly Monitoring Period & Status
    const settingsRes = await db.select().from(app_settings);
    const startStr = settingsRes.find(s => s.key === 'periode_etoser_start')?.value || '25';
    const endStr = settingsRes.find(s => s.key === 'periode_etoser_end')?.value || '3';

    let isMonevOpen = false;
    const today = new Date();
    const currentDay = today.getDate();
    let targetMonth = today.getMonth() + 1;
    let targetYear = today.getFullYear();

    const start = parseInt(startStr, 10) || 25;
    const end = parseInt(endStr, 10) || 3;

    if (start <= end) {
      if (currentDay >= start && currentDay <= end) isMonevOpen = true;
    } else {
      if (currentDay >= start) {
        isMonevOpen = true;
      } else if (currentDay <= end) {
        isMonevOpen = true;
        targetMonth -= 1;
        if (targetMonth === 0) {
          targetMonth = 12;
          targetYear -= 1;
        }
      }
    }

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    let targetMonthName = monthNames[targetMonth - 1] || 'September';

    const manualMonevPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        inArray(periode_penilaian.tipe_instrumen, ['Self-Etoser', 'Monev-Etoser'])
      )
    );
    if (manualMonevPeriods.length > 0) {
      isMonevOpen = true;
      targetMonthName = manualMonevPeriods[0].bulan || targetMonthName;
      targetYear = manualMonevPeriods[0].tahun ? parseInt(manualMonevPeriods[0].tahun, 10) : targetYear;
    }

    let hasFilledMonev = false;
    if (isMonevOpen) {
      const monevReports = await db.select().from(reports).where(
        and(
          eq(reports.type, 'ETOSER_SELF_ASSESSMENT'),
          eq(reports.period_month, targetMonthName),
          eq(reports.period_year, targetYear.toString()),
          eq(reports.user_id, etoserId)
        )
      );
      hasFilledMonev = monevReports.length > 0;
    }

    const showMonevAlert = isMonevOpen && !hasFilledMonev;
    const monevBulanan = {
      isOpen: isMonevOpen,
      hasFilled: hasFilledMonev,
      showMonevAlert,
      periodMonth: targetMonthName,
      periodYear: targetYear.toString(),
      periodLabel: `${targetMonthName} ${targetYear}`
    };

    // 3. Get all consolidated RELI records for Trajectory T0-T4

    const reliHistory = await db.select().from(reli_consolidated)
      .where(eq(reli_consolidated.user_id, etoserId))
      .orderBy(asc(reli_consolidated.periode_kode));

    // Prepare Trajectory array [T0, T1, T2, T3, T4]
    const trajectoryMap = {};
    for (const r of reliHistory) {
      trajectoryMap[r.periode_kode] = {
        periode: r.periode_kode,
        final_reli: r.final_reli,
        self_score: r.self_score,
        facil_score: r.facil_score,
        gap_score: r.gap_score,
        gap_category: r.gap_category,
        maturity_level: r.maturity_level,
        dimensions: r.dimensions_json ? JSON.parse(r.dimensions_json) : null,
        subdimensions: r.subdimensions_json ? JSON.parse(r.subdimensions_json) : null,
        growth_delta: r.growth_delta,
        growth_rate: r.growth_rate
      };
    }

    const trajectory = ['T0', 'T1', 'T2', 'T3', 'T4'].map(k => ({
      periode: k,
      score: trajectoryMap[k]?.final_reli ?? null,
      selfScore: trajectoryMap[k]?.self_score ?? null,
      facilScore: trajectoryMap[k]?.facil_score ?? null,
      maturity: trajectoryMap[k]?.maturity_level ?? '-'
    }));

    // Latest or active consolidated
    const latestConsolidated = reliHistory.length > 0 ? reliHistory[reliHistory.length - 1] : null;
    const latestDimensions = latestConsolidated?.dimensions_json ? JSON.parse(latestConsolidated.dimensions_json) : null;
    const latestSubdimensions = latestConsolidated?.subdimensions_json ? JSON.parse(latestConsolidated.subdimensions_json) : null;

    // 4. Count Agenda Hari Ini
    const activeAgendas = await db.select().from(agendas).where(eq(agendas.is_active, true));
    const agendaCount = activeAgendas.length;

    // 5. IPK
    const ipk = profile?.ipk_terakhir || 0;

    return NextResponse.json({
      success: true,
      data: {
        name: userData.name,
        angkatan: userData.angkatan,
        wilayah: userData.wilayah,
        tahun_pembinaan: userData.tahun_pembinaan,
        fase: userData.fase || 'T0',
        ipk: ipk.toFixed(2),
        semester: profile?.semester_berjalan || 'Semester 1',

        showPenilaianAlert,
        activePeriod,
        hasFilledSelf,
        monevBulanan,
        agendaCount,

        reli: {
          hasData: latestConsolidated !== null,
          latestScore: latestConsolidated?.final_reli ?? null,
          selfScore: latestConsolidated?.self_score ?? null,
          facilScore: latestConsolidated?.facil_score ?? null,
          gapScore: latestConsolidated?.gap_score ?? null,
          gapCategory: latestConsolidated?.gap_category ?? null,
          maturityLevel: latestConsolidated?.maturity_level ?? 'Belum Dinilai',
          growthDelta: latestConsolidated?.growth_delta ?? null,
          growthRate: latestConsolidated?.growth_rate ?? null,
          dimensions: latestDimensions,
          subdimensions: latestSubdimensions,
          trajectory
        }
      }
    });

  } catch (error) {
    console.error('Etoser Dashboard Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

