import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, reports, report_answers, instrumen_etoser, instrumen_fasil } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'etoser'; // 'etoser' or 'fasil'
    const now = new Date();
    const currentMonthName = MONTH_NAMES[now.getMonth()];
    const currentYear = now.getFullYear().toString();

    const bulan = searchParams.get('bulan') || currentMonthName;
    const tahun = searchParams.get('tahun') || currentYear;
    const wilayah = searchParams.get('wilayah') || 'all';
    const angkatan = searchParams.get('angkatan') || 'all';
    const fasilRole = searchParams.get('fasil_role') || 'all';

    const allUsers = await db.select().from(users);

    if (type === 'etoser') {
      // 1. Filter Etoser users
      let etosers = allUsers.filter(u => u.role?.toUpperCase() === 'ETOSER' || u.role?.toUpperCase() === 'PM');
      if (wilayah !== 'all') etosers = etosers.filter(u => u.wilayah === wilayah);
      if (angkatan !== 'all') etosers = etosers.filter(u => u.angkatan === angkatan);

      const etoserIds = etosers.map(e => e.id);

      // 2. Fetch reports for selected period
      const allReports = await db.select().from(reports).where(
        and(
          eq(reports.type, 'ETOSER_SELF_ASSESSMENT'),
          eq(reports.period_month, bulan),
          eq(reports.period_year, tahun)
        )
      );

      const relevantReports = allReports.filter(r => etoserIds.includes(r.user_id));
      const reportIds = relevantReports.map(r => r.id);

      // 3. Fetch answers for relevant reports
      let allAnswers = [];
      if (reportIds.length > 0) {
        allAnswers = await db.select().from(report_answers).where(
          inArray(report_answers.report_id, reportIds)
        );
      }

      // 4. Fetch instruments to map variables
      const instruments = await db.select().from(instrumen_etoser);
      const codeToVar = {};
      instruments.forEach(inst => {
        codeToVar[inst.kode] = inst.variabel;
      });

      // 5. Group answers by report
      const answersByReport = {};
      allAnswers.forEach(ans => {
        if (!answersByReport[ans.report_id]) answersByReport[ans.report_id] = [];
        answersByReport[ans.report_id].push(ans);
      });

      // 6. Build report mapping by user_id
      const reportByUser = {};
      relevantReports.forEach(r => {
        reportByUser[r.user_id] = r;
      });

      // 7. Calculate user rows and stats
      let totalScoresSum = 0;
      let submittedCount = 0;

      const table = etosers.map(e => {
        const report = reportByUser[e.id];
        const hasSubmitted = !!report;
        const answers = report ? (answersByReport[report.id] || []) : [];

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
          tahun_pembinaan: e.tahun_pembinaan || '-',
          hasSubmitted,
          reportId: report?.id || null,
          submittedAt: report?.timestamp ? new Date(report.timestamp).toISOString() : null,
          avgScore: hasSubmitted ? avgScore : null,
          variableScores,
          totalAnswers: answers.length
        };
      });

      // Sort: submitted first, then by name
      table.sort((a, b) => {
        if (a.hasSubmitted && !b.hasSubmitted) return -1;
        if (!a.hasSubmitted && b.hasSubmitted) return 1;
        return a.name.localeCompare(b.name);
      });

      const overallAvg = submittedCount > 0 ? Math.round((totalScoresSum / submittedCount) * 100) / 100 : 0;

      return NextResponse.json({
        success: true,
        period: { bulan, tahun },
        stats: {
          totalUsers: etosers.length,
          sudahMengisi: submittedCount,
          belumMengisi: etosers.length - submittedCount,
          persentase: etosers.length > 0 ? Math.round((submittedCount / etosers.length) * 100) : 0,
          rataRataSkor: overallAvg
        },
        table
      });

    } else {
      // 1. Filter Fasil users
      let fasils = allUsers.filter(u => u.role?.toUpperCase().includes('FASIL'));
      if (wilayah !== 'all') fasils = fasils.filter(u => u.wilayah === wilayah);
      if (fasilRole !== 'all') fasils = fasils.filter(u => u.fasil_role === fasilRole);

      const fasilIds = fasils.map(f => f.id);

      // 2. Fetch reports
      const allReports = await db.select().from(reports).where(
        and(
          eq(reports.type, 'FASIL_SELF_ASSESSMENT'),
          eq(reports.period_month, bulan),
          eq(reports.period_year, tahun)
        )
      );

      const relevantReports = allReports.filter(r => fasilIds.includes(r.user_id));
      const reportIds = relevantReports.map(r => r.id);

      let allAnswers = [];
      if (reportIds.length > 0) {
        allAnswers = await db.select().from(report_answers).where(
          inArray(report_answers.report_id, reportIds)
        );
      }

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

      const table = fasils.map(f => {
        const report = reportByUser[f.id];
        const hasSubmitted = !!report;
        const answers = report ? (answersByReport[report.id] || []) : [];

        let avgScore = 0;
        if (answers.length > 0) {
          const sum = answers.reduce((acc, a) => acc + (a.score || 0), 0);
          avgScore = Math.round((sum / answers.length) * 100) / 100;
          totalScoresSum += avgScore;
          submittedCount++;
        }

        return {
          id: f.id,
          name: f.name,
          wilayah: f.wilayah || '-',
          fasil_role: f.fasil_role || 'Reguler',
          hasSubmitted,
          reportId: report?.id || null,
          submittedAt: report?.timestamp ? new Date(report.timestamp).toISOString() : null,
          avgScore: hasSubmitted ? avgScore : null,
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
        period: { bulan, tahun },
        stats: {
          totalUsers: fasils.length,
          sudahMengisi: submittedCount,
          belumMengisi: fasils.length - submittedCount,
          persentase: fasils.length > 0 ? Math.round((submittedCount / fasils.length) * 100) : 0,
          rataRataSkor: overallAvg
        },
        table
      });
    }

  } catch (error) {
    console.error('Admin Monitoring Bulanan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
