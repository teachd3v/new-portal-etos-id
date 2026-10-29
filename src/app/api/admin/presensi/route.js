import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, agendas, attendance, post_test_questions, post_test_attempts } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { verifyJwt } from '@/lib/auth';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('cookie');
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyJwt(token);
    if (!decoded || decoded.role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const wilayahFilter = url.searchParams.get('wilayah') || '';
    const includeAll = url.searchParams.get('includeAll') === 'true';

    // 1. Get all potential participants (Etosers and Fasils)
    const conditions = [inArray(users.role, ['PM', 'Etoser', 'Fasilitator', 'Fasil', 'FASIL'])];
    if (wilayahFilter) conditions.push(eq(users.wilayah, wilayahFilter));

    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      angkatan: users.angkatan,
      wilayah: users.wilayah,
      role: users.role
    }).from(users).where(and(...conditions));

    // 2. Get agendas (active only for presensi, or all for skor tab when includeAll=true)
    const targetAgendas = includeAll
      ? await db.select().from(agendas)
      : await db.select().from(agendas).where(eq(agendas.is_active, true));
    const targetAgendaIds = targetAgendas.map(a => a.id);

    // 3. Get attendance for target agendas
    let attendanceRecords = [];
    if (targetAgendaIds.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < targetAgendaIds.length; i += chunkSize) {
        const chunk = targetAgendaIds.slice(i, i + chunkSize);
        const records = await db.select().from(attendance).where(inArray(attendance.agenda_id, chunk));
        attendanceRecords = [...attendanceRecords, ...records];
      }
    }

    // 4. Get questions & attempts for target agendas
    let questionRecords = [];
    let attemptRecords = [];
    if (targetAgendaIds.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < targetAgendaIds.length; i += chunkSize) {
        const chunk = targetAgendaIds.slice(i, i + chunkSize);
        const qRecs = await db.select({
          id: post_test_questions.id,
          agenda_id: post_test_questions.agenda_id,
          test_type: post_test_questions.test_type,
        }).from(post_test_questions).where(inArray(post_test_questions.agenda_id, chunk));
        questionRecords = [...questionRecords, ...qRecs];

        const aRecs = await db.select().from(post_test_attempts).where(inArray(post_test_attempts.agenda_id, chunk));
        attemptRecords = [...attemptRecords, ...aRecs];
      }
    }

    // 5. Structure data based on target_role of each agenda
    const summary = targetAgendas.map(agenda => {
      let targetUsers = [];
      const roleTarget = agenda.target_role || 'ETOSER';
      if (roleTarget === 'FASILITATOR') {
        targetUsers = allUsers.filter(u => u.role && u.role.toUpperCase().includes('FASIL'));
      } else if (roleTarget === 'SEMUA') {
        targetUsers = allUsers;
      } else {
        targetUsers = allUsers.filter(u => u.role && !u.role.toUpperCase().includes('FASIL'));
      }

      const attendees = attendanceRecords.filter(a => a.agenda_id === agenda.id).map(a => a.pm_id);
      const agendaQuestions = questionRecords.filter(q => q.agenda_id === agenda.id);
      const preTestCount = agendaQuestions.filter(q => (q.test_type || 'POST_TEST').toUpperCase() === 'PRE_TEST').length;
      const postTestCount = agendaQuestions.filter(q => (q.test_type || 'POST_TEST').toUpperCase() === 'POST_TEST').length;
      const agendaAttempts = attemptRecords.filter(a => a.agenda_id === agenda.id);
      
      const participantStatus = targetUsers.map(user => {
        const preAttempt = agendaAttempts.find(
          a => a.user_id === user.id && (a.test_type || 'POST_TEST').toUpperCase() === 'PRE_TEST'
        );
        const postAttempt = agendaAttempts.find(
          a => a.user_id === user.id && (a.test_type || 'POST_TEST').toUpperCase() === 'POST_TEST'
        );
        const preScore = preAttempt ? Math.round(preAttempt.score) : null;
        const postScore = postAttempt ? Math.round(postAttempt.score) : null;
        const gainScore = preScore !== null && postScore !== null ? postScore - preScore : null;

        return {
          ...user,
          hadir: attendees.includes(user.id),
          hasTakenPreTest: !!preAttempt,
          preTestScore: preScore,
          hasTakenPostTest: !!postAttempt,
          postTestScore: postScore,
          gainScore,
        };
      });

      const preScores = participantStatus.filter(p => p.preTestScore !== null).map(p => p.preTestScore);
      const postScores = participantStatus.filter(p => p.postTestScore !== null).map(p => p.postTestScore);
      const gainScores = participantStatus.filter(p => p.gainScore !== null).map(p => p.gainScore);

      const avgPreTest = preScores.length > 0 ? Math.round((preScores.reduce((a, b) => a + b, 0) / preScores.length) * 10) / 10 : null;
      const avgPostTest = postScores.length > 0 ? Math.round((postScores.reduce((a, b) => a + b, 0) / postScores.length) * 10) / 10 : null;
      const avgGain = gainScores.length > 0 ? Math.round((gainScores.reduce((a, b) => a + b, 0) / gainScores.length) * 10) / 10 : null;

      return {
        agenda: {
          ...agenda,
          preTestCount,
          postTestCount,
          hasPreTest: preTestCount > 0,
          hasPostTest: postTestCount > 0,
        },
        totalEtoser: targetUsers.length,
        totalHadir: participantStatus.filter(e => e.hadir).length,
        totalPreTest: preScores.length,
        totalPostTest: postScores.length,
        avgPreTest,
        avgPostTest,
        avgGain,
        etoserStatus: participantStatus
      };
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Admin Presensi Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
