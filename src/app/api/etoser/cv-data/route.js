import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  profil_user,
  portofolio,
  reli_consolidated,
  reports,
  report_answers,
  instrumen_etoser,
} from '@/db/schema';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function getMonevCategory(score) {
  if (score === null || score === undefined) return 'Belum Dilakukan Pengukuran';
  if (score >= 3.5) return 'Resilient Leader';
  if (score >= 2.75) return 'Transformative Leader';
  if (score >= 2.0) return 'Developing Leader';
  return 'Emerging Leader';
}

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const etoserId = authUser.id;
    const userRows = await db.select().from(users).where(eq(users.id, etoserId));
    if (!userRows.length) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }
    const userData = userRows[0];

    const profilRows = await db.select().from(profil_user).where(eq(profil_user.id, etoserId));
    const profil = profilRows[0] || {};

    const portoRows = await db
      .select()
      .from(portofolio)
      .where(eq(portofolio.user_id, etoserId))
      .orderBy(desc(portofolio.tahun));

    // 1. Complete RELI History from T0 up to Download Time
    const reliRows = await db
      .select()
      .from(reli_consolidated)
      .where(eq(reli_consolidated.user_id, etoserId))
      .orderBy(asc(reli_consolidated.periode_kode));

    const reliHistory = reliRows.map((r) => ({
      periode: r.periode_kode,
      tahun: r.tahun || '-',
      selfScore: r.self_score,
      facilScore: r.facil_score,
      finalReli: r.final_reli,
      gapScore: r.gap_score,
      gapCategory: r.gap_category || '-',
      maturityLevel: r.maturity_level || '-',
      growthDelta: r.growth_delta,
      growthRate: r.growth_rate,
      dimensions: r.dimensions_json ? JSON.parse(r.dimensions_json) : null,
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    }));

    // 2. Complete Monthly Monitoring History from Initial Submission up to Download Time
    const allMonevInstruments = await db.select().from(instrumen_etoser);
    const defaultVars = ['Integritas', 'Profesional', 'Adaptif', 'Transformatif'];
    const discoveredVars = [...new Set(allMonevInstruments.map((i) => i.variabel).filter(Boolean))];
    const monevVariablesList = discoveredVars.length > 0 ? discoveredVars : defaultVars;

    const codeToVar = {};
    allMonevInstruments.forEach((inst) => {
      codeToVar[inst.kode] = inst.variabel;
    });

    const rawMonevReports = await db.select().from(reports).where(
      and(
        eq(reports.type, 'ETOSER_SELF_ASSESSMENT'),
        eq(reports.user_id, etoserId)
      )
    );

    const dedupMap = new Map();
    for (const r of rawMonevReports) {
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

    const sortedMonev = Array.from(dedupMap.values()).sort((a, b) => {
      if (a._yNum !== b._yNum) return a._yNum - b._yNum;
      return a._mIdx - b._mIdx;
    });

    const reportIds = sortedMonev.map((r) => r.id);
    const answersByReport = {};
    for (let i = 0; i < reportIds.length; i += 50) {
      const chunk = reportIds.slice(i, i + 50);
      const rows = await db.select().from(report_answers).where(inArray(report_answers.report_id, chunk));
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

    for (const rep of sortedMonev) {
      const ansList = answersByReport[rep.id] || [];
      if (ansList.length === 0) continue;

      const total = ansList.reduce((s, a) => s + (a.score || 0), 0);
      const avg = Math.round((total / ansList.length) * 100) / 100;

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
        varScores[v] = vCounts[v] > 0 ? Math.round((vSums[v] / vCounts[v]) * 100) / 100 : null;
      });

      monevHistory.push({
        periodLabel: `${rep.period_month} ${rep.period_year}`,
        periodMonth: rep.period_month,
        periodYear: String(rep.period_year),
        score: avg,
        maturityLevel: getMonevCategory(avg),
        variables: varScores,
        submittedAt: rep.timestamp ? new Date(rep.timestamp).toISOString() : null,
      });
    }

    const cumulativeVariables = {};
    monevVariablesList.forEach((v) => {
      cumulativeVariables[v] =
        cumVarCounts[v] > 0 ? Math.round((cumVarSums[v] / cumVarCounts[v]) * 100) / 100 : null;
    });

    const cumulativeAvg =
      monevHistory.length > 0
        ? Math.round((monevHistory.reduce((s, h) => s + h.score, 0) / monevHistory.length) * 100) / 100
        : null;

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      profile: {
        id: userData.id,
        name: userData.name,
        angkatan: userData.angkatan || '-',
        wilayah: userData.wilayah || '-',
        tahun_pembinaan: userData.tahun_pembinaan || '-',
        fase: userData.fase || 'T0',
        universitas: profil.universitas || '',
        fakultas: profil.fakultas || '',
        jurusan: profil.jurusan || '',
        semester_berjalan: profil.semester_berjalan || '',
        ipk_terakhir: profil.ipk_terakhir ?? null,
        no_hp: profil.no_hp || '',
        alamat_domisili: profil.alamat_domisili || '',
        foto_profil: profil.foto_profil || userData.avatar_url || '',
      },
      portofolios: portoRows,
      reli: {
        hasData: reliHistory.length > 0,
        latest: reliHistory.length > 0 ? reliHistory[reliHistory.length - 1] : null,
        initial: reliHistory.length > 0 ? reliHistory[0] : null,
        history: reliHistory,
      },
      monitoring: {
        hasData: monevHistory.length > 0,
        totalFilled: monevHistory.length,
        cumulativeAvg,
        variablesList: monevVariablesList,
        cumulativeVariables,
        initial: monevHistory.length > 0 ? monevHistory[0] : null,
        latest: monevHistory.length > 0 ? monevHistory[monevHistory.length - 1] : null,
        history: monevHistory,
      },
    });
  } catch (error) {
    console.error('Export CV Data Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
