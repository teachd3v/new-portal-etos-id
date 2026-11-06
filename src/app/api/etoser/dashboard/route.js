import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  profil_user,
  agendas,
  periode_penilaian,
  reli_assessments,
  reli_consolidated,
  app_settings,
  reports,
  report_answers,
  instrumen_etoser,
} from '@/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function getMonevCategory(score) {
  if (score === null || score === undefined) return 'Belum Dilakukan Pengukuran';
  if (score >= 3.5) return 'Resilient Leader';
  if (score >= 2.75) return 'Transformative Leader';
  if (score >= 2.0) return 'Developing Leader';
  return 'Emerging Leader';
}

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
    const startStr = settingsRes.find((s) => s.key === 'periode_etoser_start')?.value || '25';
    const endStr = settingsRes.find((s) => s.key === 'periode_etoser_end')?.value || '3';

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

    let targetMonthName = MONTH_NAMES[targetMonth - 1] || 'September';

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

    // Fetch ALL monthly monitoring reports for this Etoser (for both alert check & individual analytics)
    const allUserMonevReports = await db.select().from(reports).where(
      and(
        eq(reports.type, 'ETOSER_SELF_ASSESSMENT'),
        eq(reports.user_id, etoserId)
      )
    );

    const hasFilledMonev = isMonevOpen
      ? allUserMonevReports.some(
          (r) => r.period_month === targetMonthName && String(r.period_year) === String(targetYear)
        )
      : false;

    const showMonevAlert = isMonevOpen && !hasFilledMonev;
    const monevBulanan = {
      isOpen: isMonevOpen,
      hasFilled: hasFilledMonev,
      showMonevAlert,
      periodMonth: targetMonthName,
      periodYear: targetYear.toString(),
      periodLabel: `${targetMonthName} ${targetYear}`,
    };

    // 2c. Build Individual Monthly Monitoring Analytics (chronological from initial to latest)
    const allMonevInstruments = await db.select().from(instrumen_etoser);
    const defaultVars = ['Integritas', 'Profesional', 'Adaptif', 'Transformatif'];
    const discoveredVars = [...new Set(allMonevInstruments.map((i) => i.variabel).filter(Boolean))];
    const monevVariablesList = discoveredVars.length > 0 ? discoveredVars : defaultVars;

    const codeToVar = {};
    allMonevInstruments.forEach((inst) => {
      codeToVar[inst.kode] = inst.variabel;
    });

    // Deduplicate same (year, month) keeping latest timestamp
    const dedupMap = new Map();
    for (const r of allUserMonevReports) {
      const mIdx = MONTH_NAMES.indexOf(r.period_month);
      const yNum = parseInt(r.period_year, 10) || 0;
      const key = `${yNum}-${mIdx >= 0 ? mIdx : r.period_month}`;
      const existing = dedupMap.get(key);
      const ts = r.timestamp ? new Date(r.timestamp).getTime() : 0;
      const existingTs = existing?.timestamp ? new Date(existing.timestamp).getTime() : -1;
      if (!existing || ts >= existingTs) {
        dedupMap.set(key, { ...r, _mIdx: mIdx >= 0 ? mIdx : 0, _yNum: yNum });
      }
    }

    const sortedMonevReports = Array.from(dedupMap.values()).sort((a, b) => {
      if (a._yNum !== b._yNum) return a._yNum - b._yNum;
      return a._mIdx - b._mIdx;
    });

    const reportIds = sortedMonevReports.map((r) => r.id);
    const answersByReport = {};
    for (let i = 0; i < reportIds.length; i += 50) {
      const chunkIds = reportIds.slice(i, i + 50);
      const rows = await db.select().from(report_answers).where(inArray(report_answers.report_id, chunkIds));
      for (const ans of rows) {
        if (!answersByReport[ans.report_id]) answersByReport[ans.report_id] = [];
        answersByReport[ans.report_id].push(ans);
      }
    }

    const monevHistory = [];
    const cumVarSums = {};
    const cumVarCounts = {};
    monevVariablesList.forEach((v) => {
      cumVarSums[v] = 0;
      cumVarCounts[v] = 0;
    });

    for (const rep of sortedMonevReports) {
      const ansList = answersByReport[rep.id] || [];
      if (ansList.length === 0) continue;

      const totalScore = ansList.reduce((sum, a) => sum + (a.score || 0), 0);
      const avgScore = Math.round((totalScore / ansList.length) * 100) / 100;

      const vSums = {};
      const vCounts = {};
      for (const a of ansList) {
        const vName = codeToVar[a.question_code];
        if (vName) {
          vSums[vName] = (vSums[vName] || 0) + (a.score || 0);
          vCounts[vName] = (vCounts[vName] || 0) + 1;
          if (cumVarSums[vName] !== undefined) {
            cumVarSums[vName] += a.score || 0;
            cumVarCounts[vName] += 1;
          }
        }
      }

      const varScores = {};
      monevVariablesList.forEach((v) => {
        varScores[v] = vCounts[v] > 0 ? Math.round((vSums[v] / vCounts[v]) * 100) / 100 : 0;
      });

      const shortYr = String(rep._yNum).slice(-2);
      const shortMo = SHORT_MONTHS[rep._mIdx] || rep.period_month?.slice(0, 3) || '-';

      monevHistory.push({
        reportId: rep.id,
        periodMonth: rep.period_month,
        periodYear: String(rep.period_year),
        shortLabel: `${shortMo} '${shortYr}`,
        fullLabel: `${rep.period_month} ${rep.period_year}`,
        score: avgScore,
        maturityLevel: getMonevCategory(avgScore),
        variables: varScores,
      });
    }

    const hasMonevData = monevHistory.length > 0;
    const latestMonev = hasMonevData ? monevHistory[monevHistory.length - 1] : null;
    const initialMonev = hasMonevData ? monevHistory[0] : null;
    const prevMonev = monevHistory.length >= 2 ? monevHistory[monevHistory.length - 2] : null;

    const cumulativeAvg = hasMonevData
      ? Math.round((monevHistory.reduce((acc, h) => acc + h.score, 0) / monevHistory.length) * 100) / 100
      : null;

    const growthVsPrev =
      latestMonev && prevMonev
        ? Math.round((latestMonev.score - prevMonev.score) * 100) / 100
        : null;

    const growthFromInitial =
      latestMonev && initialMonev && monevHistory.length >= 2
        ? Math.round((latestMonev.score - initialMonev.score) * 100) / 100
        : null;

    const cumulativeVariables = {};
    monevVariablesList.forEach((v) => {
      cumulativeVariables[v] =
        cumVarCounts[v] > 0 ? Math.round((cumVarSums[v] / cumVarCounts[v]) * 100) / 100 : 0;
    });

    const monevAnalytics = {
      hasData: hasMonevData,
      totalFilled: monevHistory.length,
      latestScore: latestMonev?.score ?? null,
      latestPeriodLabel: latestMonev?.fullLabel ?? null,
      initialPeriodLabel: initialMonev?.fullLabel ?? null,
      initialScore: initialMonev?.score ?? null,
      maturityLevel: latestMonev?.maturityLevel ?? 'Belum Dilakukan Pengukuran',
      cumulativeAvg,
      growthVsPrev,
      growthFromInitial,
      variablesList: monevVariablesList,
      latestVariables: latestMonev?.variables ?? null,
      cumulativeVariables,
      history: monevHistory,
    };

    // 3. Get all consolidated RELI records for Trajectory T0-T4
    const reliHistory = await db
      .select()
      .from(reli_consolidated)
      .where(eq(reli_consolidated.user_id, etoserId))
      .orderBy(asc(reli_consolidated.periode_kode));

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
        growth_rate: r.growth_rate,
      };
    }

    const trajectory = ['T0', 'T1', 'T2', 'T3', 'T4'].map((k) => ({
      periode: k,
      score: trajectoryMap[k]?.final_reli ?? null,
      selfScore: trajectoryMap[k]?.self_score ?? null,
      facilScore: trajectoryMap[k]?.facil_score ?? null,
      maturity: trajectoryMap[k]?.maturity_level ?? '-',
    }));

    const latestConsolidated = reliHistory.length > 0 ? reliHistory[reliHistory.length - 1] : null;
    const latestDimensions = latestConsolidated?.dimensions_json
      ? JSON.parse(latestConsolidated.dimensions_json)
      : null;
    const latestSubdimensions = latestConsolidated?.subdimensions_json
      ? JSON.parse(latestConsolidated.subdimensions_json)
      : null;

    // 4. Count Active Agendas
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
        monevAnalytics,
        agendaCount,

        reli: {
          hasData: latestConsolidated !== null,
          latestPeriode: latestConsolidated?.periode_kode ?? null,
          latestScore: latestConsolidated?.final_reli ?? null,
          selfScore: latestConsolidated?.self_score ?? null,
          facilScore: latestConsolidated?.facil_score ?? null,
          gapScore: latestConsolidated?.gap_score ?? null,
          gapCategory: latestConsolidated?.gap_category ?? null,
          maturityLevel: latestConsolidated?.maturity_level ?? 'Belum Dilakukan Pengukuran',
          growthDelta: latestConsolidated?.growth_delta ?? null,
          growthRate: latestConsolidated?.growth_rate ?? null,
          dimensions: latestDimensions,
          subdimensions: latestSubdimensions,
          trajectory,
        },
      },
    });
  } catch (error) {
    console.error('Etoser Dashboard Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
