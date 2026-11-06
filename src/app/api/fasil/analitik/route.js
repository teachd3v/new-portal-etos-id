import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  reli_consolidated,
  reports,
  report_answers,
  instrumen_etoser,
} from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const RELI_PERIODS = ['T0', 'T1', 'T2', 'T3', 'T4'];
const RELI_DIMENSIONS = [
  'Value Resilience',
  'Self Resilience',
  'Social Resilience',
  'Change Resilience',
];

function getMaturityCategory(score) {
  if (score === null || score === undefined) return 'Belum Dilakukan Pengukuran';
  if (score >= 3.5) return 'Resilient Leader';
  if (score >= 2.75) return 'Transformative Leader';
  if (score >= 2.0) return 'Developing Leader';
  return 'Emerging Leader';
}

function getGapCategory(gap) {
  if (gap === null || gap === undefined) return null;
  if (Math.abs(gap) <= 0.3) return 'Selaras';
  if (gap > 0.3) return 'Overestimate';
  return 'Perlu refleksi';
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (
      !authUser ||
      (!authUser.role?.toUpperCase().includes('FASIL') &&
        authUser.role?.toUpperCase() !== 'ADMIN')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fasilRows = await db.select().from(users).where(eq(users.id, authUser.id));
    if (!fasilRows.length) {
      return NextResponse.json({ error: 'Fasilitator tidak ditemukan' }, { status: 404 });
    }
    const fasil = fasilRows[0];
    const wilayah = fasil.wilayah || null;

    // 1. Fetch Etosers strictly scoped to this Fasilitator's wilayah (fallback to relasi_etoser if wilayah unset)
    let etosers = [];
    if (wilayah) {
      etosers = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(
          and(
            inArray(users.role, ['PM', 'Etoser', 'ETOSER']),
            eq(users.wilayah, wilayah)
          )
        );
    } else if (fasil.relasi_etoser && fasil.relasi_etoser.trim() !== '') {
      const relasiIds = fasil.relasi_etoser
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      for (let i = 0; i < relasiIds.length; i += 50) {
        const chunk = relasiIds.slice(i, i + 50);
        const rows = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(
            and(
              inArray(users.role, ['PM', 'Etoser', 'ETOSER']),
              inArray(users.id, chunk)
            )
          );
        etosers.push(...rows);
      }
    }

    const totalEtoser = etosers.length;
    const etoserIds = etosers.map((e) => e.id);

    // =========================================================================
    // 2. REGIONAL RELI ANALYTICS
    // =========================================================================
    const reliRows = [];
    for (let i = 0; i < etoserIds.length; i += 50) {
      const chunk = etoserIds.slice(i, i + 50);
      const rows = await db
        .select()
        .from(reli_consolidated)
        .where(inArray(reli_consolidated.user_id, chunk));
      reliRows.push(...rows);
    }

    const periodGroups = {};
    for (const r of reliRows) {
      const p = r.periode_kode;
      if (!p) continue;
      if (!periodGroups[p]) periodGroups[p] = [];
      periodGroups[p].push(r);
    }

    const periodAgg = {};
    for (const p of RELI_PERIODS) {
      const rows = periodGroups[p] || [];
      if (rows.length === 0) continue;

      const finalVals = rows
        .map((r) => r.final_reli)
        .filter((v) => v !== null && v !== undefined);
      const selfVals = rows
        .map((r) => r.self_score)
        .filter((v) => v !== null && v !== undefined);
      const facilVals = rows
        .map((r) => r.facil_score)
        .filter((v) => v !== null && v !== undefined);

      if (finalVals.length === 0 && selfVals.length === 0) continue;

      const avgFinal =
        finalVals.length > 0
          ? round2(finalVals.reduce((a, b) => a + b, 0) / finalVals.length)
          : selfVals.length > 0
          ? round2(selfVals.reduce((a, b) => a + b, 0) / selfVals.length)
          : null;

      const avgSelf =
        selfVals.length > 0
          ? round2(selfVals.reduce((a, b) => a + b, 0) / selfVals.length)
          : null;

      const avgFacil =
        facilVals.length > 0
          ? round2(facilVals.reduce((a, b) => a + b, 0) / facilVals.length)
          : null;

      const avgGap =
        avgSelf !== null && avgFacil !== null ? round2(avgSelf - avgFacil) : null;

      // Aggregate 4 RELI dimensions
      const dimSums = {};
      const dimCounts = {};
      RELI_DIMENSIONS.forEach((d) => {
        dimSums[d] = { self: 0, final: 0 };
        dimCounts[d] = { self: 0, final: 0 };
      });

      for (const r of rows) {
        if (!r.dimensions_json) continue;
        try {
          const parsed = JSON.parse(r.dimensions_json);
          for (const d of RELI_DIMENSIONS) {
            const dObj = parsed?.[d];
            if (!dObj) continue;
            if (dObj.self !== null && dObj.self !== undefined) {
              dimSums[d].self += Number(dObj.self);
              dimCounts[d].self += 1;
            }
            if (dObj.final !== null && dObj.final !== undefined) {
              dimSums[d].final += Number(dObj.final);
              dimCounts[d].final += 1;
            }
          }
        } catch {
          // Ignore malformed JSON
        }
      }

      const dimensions = {};
      RELI_DIMENSIONS.forEach((d) => {
        dimensions[d] = {
          self: dimCounts[d].self > 0 ? round2(dimSums[d].self / dimCounts[d].self) : 0,
          final: dimCounts[d].final > 0 ? round2(dimSums[d].final / dimCounts[d].final) : 0,
        };
      });

      periodAgg[p] = {
        periode: p,
        measuredCount: rows.length,
        avgFinal,
        avgSelf,
        avgFacil,
        avgGap,
        gapCategory: getGapCategory(avgGap),
        maturityLevel: getMaturityCategory(avgFinal),
        dimensions,
      };
    }

    const availablePeriods = RELI_PERIODS.filter((p) => Boolean(periodAgg[p]));
    const latestPeriode =
      availablePeriods.length > 0 ? availablePeriods[availablePeriods.length - 1] : null;
    const latestReli = latestPeriode ? periodAgg[latestPeriode] : null;
    const baselineReli = periodAgg['T0'] || null;

    let growthDelta = null;
    let growthRate = null;
    if (
      latestReli &&
      baselineReli &&
      latestPeriode !== 'T0' &&
      latestReli.avgFinal !== null &&
      baselineReli.avgFinal
    ) {
      growthDelta = round2(latestReli.avgFinal - baselineReli.avgFinal);
      growthRate = Math.round((growthDelta / baselineReli.avgFinal) * 1000) / 10;
    }

    const trajectory = RELI_PERIODS.map((p) => ({
      periode: p,
      score: periodAgg[p]?.avgFinal ?? null,
    }));

    const reli = {
      hasData: latestReli !== null,
      latestPeriode,
      latestScore: latestReli?.avgFinal ?? null,
      selfScore: latestReli?.avgSelf ?? null,
      facilScore: latestReli?.avgFacil ?? null,
      gapScore: latestReli?.avgGap ?? null,
      gapCategory: latestReli?.gapCategory ?? null,
      maturityLevel: latestReli?.maturityLevel ?? 'Belum Dilakukan Pengukuran',
      measuredCount: latestReli?.measuredCount ?? 0,
      totalEtoser,
      growthDelta,
      growthRate,
      dimensions: latestReli?.dimensions ?? null,
      trajectory,
    };

    // =========================================================================
    // 3. REGIONAL MONTHLY MONITORING ANALYTICS
    // =========================================================================
    const allMonevInstruments = await db.select().from(instrumen_etoser);
    const defaultVars = ['Integritas', 'Profesional', 'Adaptif', 'Transformatif'];
    const discoveredVars = [
      ...new Set(allMonevInstruments.map((i) => i.variabel).filter(Boolean)),
    ];
    const monevVariablesList = discoveredVars.length > 0 ? discoveredVars : defaultVars;

    const codeToVar = {};
    allMonevInstruments.forEach((inst) => {
      codeToVar[inst.kode] = inst.variabel;
    });

    const rawMonevReports = [];
    for (let i = 0; i < etoserIds.length; i += 50) {
      const chunk = etoserIds.slice(i, i + 50);
      const rows = await db
        .select()
        .from(reports)
        .where(
          and(
            eq(reports.type, 'ETOSER_SELF_ASSESSMENT'),
            inArray(reports.user_id, chunk)
          )
        );
      rawMonevReports.push(...rows);
    }

    // Deduplicate per (user_id, year, month) keeping latest submission
    const userPeriodMap = new Map();
    for (const r of rawMonevReports) {
      const mIdx = MONTH_NAMES.indexOf(r.period_month);
      const yNum = parseInt(r.period_year, 10) || 0;
      const key = `${r.user_id}::${yNum}::${mIdx >= 0 ? mIdx : r.period_month}`;
      const existing = userPeriodMap.get(key);
      const ts = r.timestamp ? new Date(r.timestamp).getTime() : 0;
      const existingTs = existing?.timestamp ? new Date(existing.timestamp).getTime() : -1;
      if (!existing || ts >= existingTs) {
        userPeriodMap.set(key, { ...r, _mIdx: mIdx >= 0 ? mIdx : 0, _yNum: yNum });
      }
    }

    const dedupReports = Array.from(userPeriodMap.values());
    const reportIds = dedupReports.map((r) => r.id);

    const answersByReport = {};
    for (let i = 0; i < reportIds.length; i += 50) {
      const chunk = reportIds.slice(i, i + 50);
      const rows = await db
        .select()
        .from(report_answers)
        .where(inArray(report_answers.report_id, chunk));
      for (const ans of rows) {
        if (!answersByReport[ans.report_id]) answersByReport[ans.report_id] = [];
        answersByReport[ans.report_id].push(ans);
      }
    }

    // Group reports by (year, month)
    const monthBuckets = new Map();
    for (const rep of dedupReports) {
      const ansList = answersByReport[rep.id] || [];
      if (ansList.length === 0) continue;

      const userAvg =
        ansList.reduce((sum, a) => sum + (a.score || 0), 0) / ansList.length;

      const userVarSums = {};
      const userVarCounts = {};
      for (const a of ansList) {
        const vName = codeToVar[a.question_code];
        if (vName) {
          userVarSums[vName] = (userVarSums[vName] || 0) + (a.score || 0);
          userVarCounts[vName] = (userVarCounts[vName] || 0) + 1;
        }
      }

      const bKey = `${rep._yNum}-${String(rep._mIdx).padStart(2, '0')}`;
      if (!monthBuckets.has(bKey)) {
        monthBuckets.set(bKey, {
          yNum: rep._yNum,
          mIdx: rep._mIdx,
          monthName: rep.period_month,
          yearStr: String(rep.period_year),
          userScores: [],
          varSums: {},
          varCounts: {},
        });
      }

      const bucket = monthBuckets.get(bKey);
      bucket.userScores.push(userAvg);
      for (const v of monevVariablesList) {
        if (userVarCounts[v] > 0) {
          bucket.varSums[v] =
            (bucket.varSums[v] || 0) + userVarSums[v] / userVarCounts[v];
          bucket.varCounts[v] = (bucket.varCounts[v] || 0) + 1;
        }
      }
    }

    const sortedBuckets = Array.from(monthBuckets.values()).sort((a, b) => {
      if (a.yNum !== b.yNum) return a.yNum - b.yNum;
      return a.mIdx - b.mIdx;
    });

    const cumVarSums = {};
    const cumVarCounts = {};
    monevVariablesList.forEach((v) => {
      cumVarSums[v] = 0;
      cumVarCounts[v] = 0;
    });

    const monevHistory = sortedBuckets.map((b) => {
      const avgScore = round2(
        b.userScores.reduce((s, v) => s + v, 0) / b.userScores.length
      );
      const varScores = {};
      for (const v of monevVariablesList) {
        const val = b.varCounts[v] > 0 ? round2(b.varSums[v] / b.varCounts[v]) : 0;
        varScores[v] = val;
        if (b.varCounts[v] > 0) {
          cumVarSums[v] += val;
          cumVarCounts[v] += 1;
        }
      }

      const shortMonth = SHORT_MONTHS[b.mIdx] || b.monthName.slice(0, 3);
      return {
        shortLabel: `${shortMonth} '${b.yearStr.slice(-2)}`,
        fullLabel: `${b.monthName} ${b.yearStr}`,
        score: avgScore,
        submittedCount: b.userScores.length,
        maturityLevel: getMaturityCategory(avgScore),
        variables: varScores,
      };
    });

    const hasMonevData = monevHistory.length > 0;
    const latestMonev = hasMonevData ? monevHistory[monevHistory.length - 1] : null;
    const prevMonev =
      monevHistory.length >= 2 ? monevHistory[monevHistory.length - 2] : null;
    const initialMonev = hasMonevData ? monevHistory[0] : null;

    const cumulativeAvg = hasMonevData
      ? round2(monevHistory.reduce((s, h) => s + h.score, 0) / monevHistory.length)
      : null;

    const growthVsPrev =
      latestMonev && prevMonev ? round2(latestMonev.score - prevMonev.score) : null;

    const cumulativeVariables = {};
    monevVariablesList.forEach((v) => {
      cumulativeVariables[v] =
        cumVarCounts[v] > 0 ? round2(cumVarSums[v] / cumVarCounts[v]) : 0;
    });

    const monevAnalytics = {
      hasData: hasMonevData,
      totalFilled: monevHistory.length,
      totalEtoser,
      latestSubmittedCount: latestMonev?.submittedCount ?? 0,
      latestScore: latestMonev?.score ?? null,
      latestPeriodLabel: latestMonev?.fullLabel ?? null,
      initialPeriodLabel: initialMonev?.fullLabel ?? null,
      maturityLevel: latestMonev?.maturityLevel ?? 'Belum Dilakukan Pengukuran',
      cumulativeAvg,
      growthVsPrev,
      variablesList: monevVariablesList,
      latestVariables: latestMonev?.variables ?? null,
      cumulativeVariables,
      history: monevHistory,
    };

    return NextResponse.json({
      success: true,
      data: {
        wilayah: wilayah || '-',
        totalEtoser,
        reli,
        monevAnalytics,
      },
    });
  } catch (error) {
    console.error('Fasil Analitik API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
