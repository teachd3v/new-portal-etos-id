import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, reports, report_answers, instrumen_etoser, instrumen_fasil, profil_user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || (authUser.role?.toUpperCase() !== 'ADMIN' && !authUser.role?.toUpperCase().includes('FASIL'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const reportList = await db.select().from(reports).where(eq(reports.id, reportId));
    if (reportList.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    const report = reportList[0];

    const userList = await db.select().from(users).where(eq(users.id, report.user_id));
    const user = userList[0] || {};

    const profileList = await db.select().from(profil_user).where(eq(profil_user.id, report.user_id));
    const profile = profileList[0] || {};

    const answers = await db.select().from(report_answers).where(eq(report_answers.report_id, reportId));

    let questions = [];
    if (report.type === 'ETOSER_SELF_ASSESSMENT') {
      questions = await db.select().from(instrumen_etoser);
    } else {
      questions = await db.select().from(instrumen_fasil);
    }

    const questionMap = {};
    questions.forEach(q => {
      questionMap[q.kode] = q;
    });

    const detailedAnswers = answers.map(ans => {
      const q = questionMap[ans.question_code] || {};
      return {
        id: ans.id,
        kode: ans.question_code,
        item_pernyataan: q.item_pernyataan || ans.question_code,
        variabel: q.variabel || q.role || '-',
        indikator: q.indikator || '-',
        jenis_skala: q.jenis_skala || '1-4',
        pertanyaan_validasi: q.pertanyaan_validasi || '-',
        score: ans.score,
        validation_answer: ans.value || ''
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        report: {
          id: report.id,
          type: report.type,
          period_month: report.period_month,
          period_year: report.period_year,
          timestamp: report.timestamp
        },
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          wilayah: user.wilayah,
          angkatan: user.angkatan,
          fasil_role: user.fasil_role,
          avatar_url: user.avatar_url,
          universitas: profile.universitas || '',
          jurusan: profile.jurusan || ''
        },
        answers: detailedAnswers
      }
    });

  } catch (error) {
    console.error('Detail Monitoring Bulanan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
