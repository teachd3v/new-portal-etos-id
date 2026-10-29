import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users, profil_user, reli_instrumen, reli_assessments,
  reli_consolidated, catatan_admin, periode_penilaian,
  reports, report_answers, instrumen_etoser
} from '@/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function getMaturityCategory(score) {
  if (score === null || score === undefined) return 'Belum Mengisi';
  if (score >= 3.5) return 'Resilient Leader';
  if (score >= 2.75) return 'Transformative Leader';
  if (score >= 2.0) return 'Developing Leader';
  return 'Emerging Leader';
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const authUser = await getAuthUser(req);
    if (!authUser || (authUser.role?.toUpperCase() !== 'ADMIN' && !authUser.role?.toUpperCase().includes('FASIL'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const queryBulan = searchParams.get('bulan') || MONTH_NAMES[now.getMonth()];
    const queryTahun = searchParams.get('tahun') || now.getFullYear().toString();

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

    // 5. Fetch Admin Note (RELI)
    const adminNotes = await db.select().from(catatan_admin).where(
      and(
        eq(catatan_admin.target_user_id, id),
        eq(catatan_admin.period_month, activeKode)
      )
    );
    const currentNote = adminNotes[0]?.catatan || '';

    // 6. Fetch Monitoring Bulanan Etoser Data (Trajectory, 4 Variables, Item Details, National Comparison)
    const allMonevInstruments = await db.select().from(instrumen_etoser);
    const defaultVars = ['Integritas', 'Profesional', 'Adaptif', 'Transformatif'];
    const discoveredVars = [...new Set(allMonevInstruments.map(i => i.variabel).filter(Boolean))];
    const monevVariablesList = discoveredVars.length > 0 ? discoveredVars : defaultVars;

    const codeToMonevInst = {};
    allMonevInstruments.forEach(inst => {
      codeToMonevInst[inst.kode] = inst;
    });

    // All reports of this user in queryTahun
    const userYearReports = await db.select().from(reports).where(
      and(
        eq(reports.type, 'ETOSER_SELF_ASSESSMENT'),
        eq(reports.user_id, id),
        eq(reports.period_year, queryTahun)
      )
    );

    // National reports in (queryBulan, queryTahun) for radar benchmark comparison
    const nationalMonthReports = await db.select().from(reports).where(
      and(
        eq(reports.type, 'ETOSER_SELF_ASSESSMENT'),
        eq(reports.period_month, queryBulan),
        eq(reports.period_year, queryTahun)
      )
    );

    const allRelevantReportIds = [
      ...new Set([
        ...userYearReports.map(r => r.id),
        ...nationalMonthReports.map(r => r.id)
      ])
    ];

    let allMonevAnswers = [];
    if (allRelevantReportIds.length > 0) {
      allMonevAnswers = await db.select().from(report_answers).where(
        inArray(report_answers.report_id, allRelevantReportIds)
      );
    }

    const monevAnswersByReport = {};
    allMonevAnswers.forEach(ans => {
      if (!monevAnswersByReport[ans.report_id]) monevAnswersByReport[ans.report_id] = [];
      monevAnswersByReport[ans.report_id].push(ans);
    });

    // Compute National Variable Averages for (queryBulan, queryTahun)
    const natVarSums = {};
    const natVarCounts = {};
    monevVariablesList.forEach(v => {
      natVarSums[v] = 0;
      natVarCounts[v] = 0;
    });

    nationalMonthReports.forEach(r => {
      const rAns = monevAnswersByReport[r.id] || [];
      rAns.forEach(a => {
        const vName = codeToMonevInst[a.question_code]?.variabel;
        if (vName && natVarSums[vName] !== undefined) {
          natVarSums[vName] += (a.score || 0);
          natVarCounts[vName] += 1;
        }
      });
    });

    const nationalVarAvg = {};
    monevVariablesList.forEach(v => {
      nationalVarAvg[v] = natVarCounts[v] > 0
        ? Math.round((natVarSums[v] / natVarCounts[v]) * 100) / 100
        : 0;
    });

    // Build 12-month trajectory for this Etoser in queryTahun
    const reportByMonth = {};
    userYearReports.forEach(r => {
      reportByMonth[r.period_month] = r;
    });

    const monevTrajectory = MONTH_NAMES.map((mName, idx) => {
      const rep = reportByMonth[mName];
      const ans = rep ? (monevAnswersByReport[rep.id] || []) : [];
      let mScore = null;
      if (ans.length > 0) {
        const s = ans.reduce((acc, a) => acc + (a.score || 0), 0) / ans.length;
        mScore = Math.round(s * 100) / 100;
      }
      return {
        periode: SHORT_MONTHS[idx],
        fullMonth: mName,
        score: mScore
      };
    });

    // Current selected month report for this Etoser
    const currentMonevReport = reportByMonth[queryBulan] || null;
    const currentMonevAnswers = currentMonevReport ? (monevAnswersByReport[currentMonevReport.id] || []) : [];
    const currentAnswerMap = {};
    currentMonevAnswers.forEach(a => {
      currentAnswerMap[a.question_code] = a;
    });

    let monevFinalScore = null;
    const monevDimensions = {};
    monevVariablesList.forEach(v => {
      monevDimensions[v] = {
        self: 0,
        national: nationalVarAvg[v] || 0,
        final: 0
      };
    });

    if (currentMonevAnswers.length > 0) {
      const totalS = currentMonevAnswers.reduce((acc, a) => acc + (a.score || 0), 0);
      monevFinalScore = Math.round((totalS / currentMonevAnswers.length) * 100) / 100;

      const vSums = {};
      const vCounts = {};
      currentMonevAnswers.forEach(a => {
        const vName = codeToMonevInst[a.question_code]?.variabel;
        if (vName) {
          vSums[vName] = (vSums[vName] || 0) + (a.score || 0);
          vCounts[vName] = (vCounts[vName] || 0) + 1;
        }
      });

      monevVariablesList.forEach(v => {
        const avg = vCounts[v] > 0 ? Math.round((vSums[v] / vCounts[v]) * 100) / 100 : 0;
        monevDimensions[v] = {
          self: avg,
          national: nationalVarAvg[v] || 0,
          final: avg
        };
      });
    }

    // Calculate growth delta vs previous filled month in the year
    const currentMonthIdx = MONTH_NAMES.indexOf(queryBulan);
    let prevFilledScore = null;
    for (let i = currentMonthIdx - 1; i >= 0; i--) {
      if (monevTrajectory[i]?.score !== null) {
        prevFilledScore = monevTrajectory[i].score;
        break;
      }
    }
    const monevGrowthDelta = (monevFinalScore !== null && prevFilledScore !== null)
      ? Math.round((monevFinalScore - prevFilledScore) * 100) / 100
      : null;

    // Filter instruments for this user's tahun_pembinaan (or all if none match)
    const userTahunPembinaan = String(user.tahun_pembinaan || '1');
    let userInstruments = allMonevInstruments.filter(i => String(i.tahun_pembinaan) === userTahunPembinaan);
    if (userInstruments.length === 0) {
      userInstruments = allMonevInstruments;
    }

    const monevItemDetails = userInstruments.map(inst => {
      const ans = currentAnswerMap[inst.kode];
      return {
        id: inst.id,
        kode: inst.kode,
        variabel: inst.variabel,
        indikator: inst.indikator,
        jenis_skala: inst.jenis_skala,
        item_pernyataan: inst.item_pernyataan,
        pertanyaan_validasi: inst.pertanyaan_validasi,
        score: ans ? ans.score : null,
        validation_answer: ans ? (ans.value || '') : ''
      };
    });

    // Fetch Admin Note for Monitoring Bulanan (bulan, tahun)
    const monevAdminNotes = await db.select().from(catatan_admin).where(
      and(
        eq(catatan_admin.target_user_id, id),
        eq(catatan_admin.period_month, queryBulan),
        eq(catatan_admin.period_year, queryTahun)
      )
    );
    const currentMonevNote = monevAdminNotes[0]?.catatan || '';

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
      monitoring: {
        bulan: queryBulan,
        tahun: queryTahun,
        variablesList: monevVariablesList,
        current: {
          hasSubmitted: !!currentMonevReport,
          reportId: currentMonevReport?.id || null,
          submittedAt: currentMonevReport?.timestamp ? new Date(currentMonevReport.timestamp).toISOString() : null,
          final_score: monevFinalScore,
          maturity_level: getMaturityCategory(monevFinalScore),
          dimensions: monevDimensions,
          growth_delta: monevGrowthDelta
        },
        trajectory: monevTrajectory,
        itemDetails: monevItemDetails,
        catatanAdmin: currentMonevNote
      },
      catatanAdmin: currentNote
    });

  } catch (error) {
    console.error('Fetch RELI Etoser Details Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

