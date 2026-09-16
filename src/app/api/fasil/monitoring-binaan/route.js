import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, reports, report_answers, instrumen_etoser, profil_user } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !authUser.role?.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fasilRecords = await db.select().from(users).where(eq(users.id, authUser.id));
    if (fasilRecords.length === 0) {
      return NextResponse.json({ error: 'Fasil not found' }, { status: 404 });
    }
    const fasil = fasilRecords[0];

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const currentMonthName = MONTH_NAMES[now.getMonth()];
    const currentYear = now.getFullYear().toString();

    const bulan = searchParams.get('bulan') || currentMonthName;
    const tahun = searchParams.get('tahun') || currentYear;

    // 1. Fetch Etosers in this Fasil's territory / assignment
    const allUsers = await db.select().from(users);
    let binaanList = [];

    if (fasil.relasi_etoser && fasil.relasi_etoser.trim().length > 0) {
      const explicitIds = fasil.relasi_etoser.split(',').map(s => s.trim()).filter(Boolean);
      binaanList = allUsers.filter(u => 
        (u.role?.toUpperCase() === 'ETOSER' || u.role?.toUpperCase() === 'PM') &&
        (explicitIds.includes(u.id) || u.wilayah === fasil.wilayah)
      );
    } else {
      binaanList = allUsers.filter(u => 
        (u.role?.toUpperCase() === 'ETOSER' || u.role?.toUpperCase() === 'PM') &&
        u.wilayah === fasil.wilayah
      );
    }

    const binaanIds = binaanList.map(b => b.id);

    // 2. Fetch profiles
    const profiles = await db.select().from(profil_user);
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.id] = p; });

    // 3. Fetch reports for this period
    let relevantReports = [];
    if (binaanIds.length > 0) {
      const allReports = await db.select().from(reports).where(
        and(
          eq(reports.type, 'ETOSER_SELF_ASSESSMENT'),
          eq(reports.period_month, bulan),
          eq(reports.period_year, tahun)
        )
      );
      relevantReports = allReports.filter(r => binaanIds.includes(r.user_id));
    }

    const reportIds = relevantReports.map(r => r.id);

    // 4. Fetch answers
    let allAnswers = [];
    if (reportIds.length > 0) {
      allAnswers = await db.select().from(report_answers).where(
        inArray(report_answers.report_id, reportIds)
      );
    }

    const instruments = await db.select().from(instrumen_etoser);
    const codeToVar = {};
    instruments.forEach(inst => {
      codeToVar[inst.kode] = inst.variabel;
    });

    const answersByReport = {};
    allAnswers.forEach(ans => {
      if (!answersByReport[ans.report_id]) answersByReport[ans.report_id] = [];
      answersByReport[ans.report_id].push(ans);
    });

    const reportByUser = {};
    relevantReports.forEach(r => {
      reportByUser[r.user_id] = r;
    });

    let totalScoresSum = 0;
    let submittedCount = 0;

    const table = binaanList.map(e => {
      const report = reportByUser[e.id];
      const hasSubmitted = !!report;
      const answers = report ? (answersByReport[report.id] || []) : [];
      const prof = profileMap[e.id] || {};

      let avgScore = 0;
      const varTotals = {};
      const varCounts = {};

      if (answers.length > 0) {
        let sum = 0;
        answers.forEach(a => {
          const sc = a.score || 0;
          sum += sc;
          const v = codeToVar[a.question_code] || 'Lainnya';
          varTotals[v] = (varTotals[v] || 0) + sc;
          varCounts[v] = (varCounts[v] || 0) + 1;
        });
        avgScore = Math.round((sum / answers.length) * 100) / 100;
        totalScoresSum += avgScore;
        submittedCount++;
      }

      const variableScores = {};
      Object.keys(varTotals).forEach(k => {
        variableScores[k] = Math.round((varTotals[k] / varCounts[k]) * 100) / 100;
      });

      return {
        id: e.id,
        name: e.name,
        wilayah: e.wilayah || '-',
        angkatan: e.angkatan || '-',
        universitas: prof.universitas || '-',
        jurusan: prof.jurusan || '-',
        avatar_url: e.avatar_url,
        hasSubmitted,
        reportId: report?.id || null,
        submittedAt: report?.timestamp ? new Date(report.timestamp).toISOString() : null,
        avgScore: hasSubmitted ? avgScore : null,
        variableScores,
        totalAnswers: answers.length
      };
    });

    table.sort((a, b) => {
      if (a.hasSubmitted && !b.hasSubmitted) return -1;
      if (!a.hasSubmitted && b.hasSubmitted) return 1;
      return a.name.localeCompare(b.name);
    });

    const overallAvg = submittedCount > 0 ? Math.round((totalScoresSum / submittedCount) * 100) / 100 : 0;

    return NextResponse.json({
      success: true,
      fasilInfo: {
        id: fasil.id,
        name: fasil.name,
        wilayah: fasil.wilayah,
        fasil_role: fasil.fasil_role
      },
      period: { bulan, tahun },
      stats: {
        totalBinaan: binaanList.length,
        sudahMengisi: submittedCount,
        belumMengisi: binaanList.length - submittedCount,
        persentase: binaanList.length > 0 ? Math.round((submittedCount / binaanList.length) * 100) : 0,
        rataRataSkor: overallAvg
      },
      table
    });

  } catch (error) {
    console.error('Fasil Monitoring Binaan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
