import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, agendas, attendance, post_test_questions, post_test_attempts, agenda_submissions } from '@/db/schema';
import { eq, inArray, and, or, isNull } from 'drizzle-orm';
import { verifyJwt } from '@/lib/auth';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('cookie');
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyJwt(token);
    if (!decoded || !decoded.role.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Get Fasil data to know their Wilayah
    const fasilRecords = await db.select().from(users).where(eq(users.id, decoded.id));
    if (!fasilRecords.length) return NextResponse.json({ error: 'Fasil not found' }, { status: 404 });
    const fasil = fasilRecords[0];

    // 2. Get Etosers in the same Wilayah
    const etosers = await db.select({
      id: users.id,
      name: users.name,
      angkatan: users.angkatan,
      wilayah: users.wilayah,
      role: users.role
    }).from(users).where(
      and(
        inArray(users.role, ['PM', 'Etoser']),
        eq(users.wilayah, fasil.wilayah)
      )
    );

    const etoserIds = etosers.map(e => e.id);

    // 3. Get all agendas (for Skor & Kelola Agenda) and active agendas for ETOSER or SEMUA
    const allAgendasRaw = await db.select().from(agendas);
    const activeAgendas = allAgendasRaw.filter(
      a => a.is_active && (!a.target_role || a.target_role === 'ETOSER' || a.target_role === 'SEMUA')
    );
    const etoserTargetAgendas = allAgendasRaw.filter(
      a => !a.target_role || a.target_role === 'ETOSER' || a.target_role === 'SEMUA'
    );

    // 4. Fetch all questions, attempts, and submissions
    const questions = await db.select().from(post_test_questions);
    const allAttempts = await db.select().from(post_test_attempts);
    const allSubmissions = await db.select().from(agenda_submissions);

    // 5. Get attendance for these etosers across agendas
    let attendanceRecords = [];
    if (etoserIds.length > 0 && etoserTargetAgendas.length > 0) {
      attendanceRecords = await db.select().from(attendance).where(
        and(
          inArray(attendance.pm_id, etoserIds),
          inArray(attendance.agenda_id, etoserTargetAgendas.map(a => a.id))
        )
      );
    }

    const buildAgendaSummary = (agendaList) => agendaList.map(agenda => {
      const attendees = attendanceRecords.filter(a => a.agenda_id === agenda.id).map(a => a.pm_id);
      const agendaQs = questions.filter(q => q.agenda_id === agenda.id);
      const preTestCount = agendaQs.filter(q => (q.test_type || 'POST_TEST').toUpperCase() === 'PRE_TEST').length;
      const postTestCount = agendaQs.filter(q => (q.test_type || 'POST_TEST').toUpperCase() === 'POST_TEST').length;
      const agendaAttempts = allAttempts.filter(a => a.agenda_id === agenda.id);
      const agendaSubs = allSubmissions.filter(s => s.agenda_id === agenda.id);

      const etoserStatus = etosers.map(etoser => {
        const preAttempt = agendaAttempts.find(
          a => a.user_id === etoser.id && (a.test_type || 'POST_TEST').toUpperCase() === 'PRE_TEST'
        );
        const postAttempt = agendaAttempts.find(
          a => a.user_id === etoser.id && (a.test_type || 'POST_TEST').toUpperCase() === 'POST_TEST'
        );
        const preScore = preAttempt ? Math.round(preAttempt.score) : null;
        const postScore = postAttempt ? Math.round(postAttempt.score) : null;
        const gainScore = preScore !== null && postScore !== null ? postScore - preScore : null;
        const sub = agendaSubs.find(s => s.user_id === etoser.id) || null;

        return {
          ...etoser,
          hadir: attendees.includes(etoser.id),
          hasTakenPreTest: !!preAttempt,
          preTestScore: preScore,
          hasTakenPostTest: !!postAttempt,
          postTestScore: postScore,
          gainScore,
          submission: sub,
        };
      });

      const preScores = etoserStatus.filter(p => p.preTestScore !== null).map(p => p.preTestScore);
      const postScores = etoserStatus.filter(p => p.postTestScore !== null).map(p => p.postTestScore);
      const gainScores = etoserStatus.filter(p => p.gainScore !== null).map(p => p.gainScore);

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
        totalEtoser: etosers.length,
        totalHadir: attendees.length,
        totalPreTest: preScores.length,
        totalPostTest: postScores.length,
        avgPreTest,
        avgPostTest,
        avgGain,
        etoserStatus
      };
    });

    const summary = buildAgendaSummary(activeAgendas);
    const allBinaanSummary = buildAgendaSummary(etoserTargetAgendas);

    // 6. Get active agendas targeted to FASILITATOR or SEMUA
    const fasilAgendasRaw = allAgendasRaw.filter(
      a => a.is_active && (a.target_role === 'FASILITATOR' || a.target_role === 'SEMUA')
    );

    // Get Fasil's own attendance records
    const fasilAttendance = await db.select().from(attendance).where(eq(attendance.pm_id, decoded.id));
    const attendedFasilAgendaIds = fasilAttendance.map(a => a.agenda_id);

    // Attempts for this Fasil user
    const fasilUserAttempts = allAttempts.filter(a => a.user_id === decoded.id);

    const now = new Date();
    const fasilAgendas = fasilAgendasRaw.map(agenda => {
      let is_open_now = true;
      if (agenda.start_date) {
        const startDateTimeStr = `${agenda.start_date}T${agenda.start_time || '00:00'}:00+07:00`;
        const endDateTimeStr = `${agenda.end_date || agenda.start_date}T${agenda.end_time || '23:59'}:59+07:00`;
        const startDateTime = new Date(startDateTimeStr);
        const endDateTime = new Date(endDateTimeStr);
        is_open_now = now >= startDateTime && now <= endDateTime;
      }

      const agendaQs = questions.filter(q => q.agenda_id === agenda.id);
      const hasPreTest = agendaQs.some(q => (q.test_type || 'POST_TEST').toUpperCase() === 'PRE_TEST');
      const hasPostTest = agendaQs.some(q => (q.test_type || 'POST_TEST').toUpperCase() === 'POST_TEST');

      const preAttempt = fasilUserAttempts.find(
        a => a.agenda_id === agenda.id && (a.test_type || 'POST_TEST').toUpperCase() === 'PRE_TEST'
      );
      const postAttempt = fasilUserAttempts.find(
        a => a.agenda_id === agenda.id && (a.test_type || 'POST_TEST').toUpperCase() === 'POST_TEST'
      );

      const preScore = preAttempt ? Math.round(preAttempt.score) : null;
      const postScore = postAttempt ? Math.round(postAttempt.score) : null;
      const gainScore = preScore !== null && postScore !== null ? postScore - preScore : null;

      return {
        ...agenda,
        hasAttended: attendedFasilAgendaIds.includes(agenda.id),
        is_open_now,
        hasPreTest,
        hasTakenPreTest: !!preAttempt,
        preTestScore: preScore,
        hasPostTest,
        hasTakenPostTest: !!postAttempt,
        postTestScore: postScore,
        gainScore,
      };
    });

    // 7. Enriched agendas list for Fasil agenda setup (especially Wilayah agendas)
    const managedAgendas = allAgendasRaw.map(agenda => {
      const agendaQs = questions.filter(q => q.agenda_id === agenda.id);
      return {
        ...agenda,
        preTestCount: agendaQs.filter(q => (q.test_type || 'POST_TEST').toUpperCase() === 'PRE_TEST').length,
        postTestCount: agendaQs.filter(q => (q.test_type || 'POST_TEST').toUpperCase() === 'POST_TEST').length,
      };
    });

    return NextResponse.json({ 
      success: true,
      wilayah: fasil.wilayah,
      data: summary,
      allBinaanSummary,
      fasilAgendas,
      managedAgendas,
    });
  } catch (error) {
    console.error("Presensi Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('cookie');
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyJwt(token);
    if (!decoded || !decoded.role.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { agenda_id } = body;
    const userId = decoded.id;

    const agendaList = await db.select().from(agendas).where(eq(agendas.id, agenda_id));
    if (agendaList.length === 0) {
      return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 });
    }
    
    const agenda = agendaList[0];
    
    let is_open_now = true;
    const now = new Date();
    if (agenda.start_date) {
      const startDateTimeStr = `${agenda.start_date}T${agenda.start_time || '00:00'}:00+07:00`;
      const endDateTimeStr = `${agenda.end_date || agenda.start_date}T${agenda.end_time || '23:59'}:59+07:00`;
      const startDateTime = new Date(startDateTimeStr);
      const endDateTime = new Date(endDateTimeStr);
      is_open_now = now >= startDateTime && now <= endDateTime;
    }
    
    if (!is_open_now) {
      return NextResponse.json({ error: 'Sesi presensi untuk agenda ini sudah ditutup atau belum dimulai' }, { status: 403 });
    }

    const existing = await db.select().from(attendance).where(and(eq(attendance.pm_id, userId), eq(attendance.agenda_id, agenda_id)));
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Anda sudah melakukan presensi untuk agenda ini' }, { status: 400 });
    }

    const id = `ATT-${Date.now()}`;
    const execution_date = new Date().toISOString().split('T')[0];

    await db.insert(attendance).values({
      id,
      agenda_id,
      pm_id: userId,
      execution_date,
      timestamp: new Date()
    });

    return NextResponse.json({ message: 'Presensi berhasil dicatat' });
  } catch (error) {
    console.error('Fasil Submit Presensi Error:', error);
    return NextResponse.json({ error: 'Failed to submit presensi' }, { status: 500 });
  }
}
