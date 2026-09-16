import { db } from '@/db';
import { agendas, attendance, post_test_questions, post_test_attempts } from '@/db/schema';
import { eq, and, or, isNull, sql } from 'drizzle-orm';

export async function GET(req) {
  try {
    // In a real app, we would get the Etoser ID from the JWT token.
    // For now, we mock an Etoser ID or get it from query params.
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || 'E2023019';

    // Get active agendas targeted to ETOSER or SEMUA
    const allAgendas = await db.select().from(agendas).where(
      and(
        eq(agendas.is_active, true),
        or(
          eq(agendas.target_role, 'ETOSER'),
          eq(agendas.target_role, 'SEMUA'),
          isNull(agendas.target_role)
        )
      )
    );
    
    // Get attendance records for this user
    const userAttendance = await db.select().from(attendance).where(eq(attendance.pm_id, userId));
    const attendedAgendaIds = userAttendance.map(a => a.agenda_id);

    // Fetch all post test questions to check if kuis exists
    const questions = await db.select().from(post_test_questions);
    
    // Fetch attempts for this user
    const attempts = await db.select().from(post_test_attempts).where(eq(post_test_attempts.user_id, userId));

    // Combine and add real-time validation
    const now = new Date();
    const result = allAgendas.map(agenda => {
      let is_open_now = true;
      if (agenda.start_date) {
        const startDateTimeStr = `${agenda.start_date}T${agenda.start_time || '00:00'}:00+07:00`;
        const endDateTimeStr = `${agenda.end_date || agenda.start_date}T${agenda.end_time || '23:59'}:59+07:00`;
        const startDateTime = new Date(startDateTimeStr);
        const endDateTime = new Date(endDateTimeStr);
        is_open_now = now >= startDateTime && now <= endDateTime;
      }

      // Check if this agenda has any questions
      const hasPostTest = questions.some(q => q.agenda_id === agenda.id);
      
      // Check if user has taken it
      const attempt = attempts.find(a => a.agenda_id === agenda.id);

      return {
        ...agenda,
        hasAttended: attendedAgendaIds.includes(agenda.id),
        is_open_now,
        hasPostTest,
        hasTakenPostTest: !!attempt,
        postTestScore: attempt ? Math.round(attempt.score) : null
      };
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch presensi data' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { agenda_id, userId } = body;
    
    // Mock user ID for now if not provided
    const pmId = userId || 'E2023019';

    const agendaList = await db.select().from(agendas).where(eq(agendas.id, agenda_id));
    if (agendaList.length === 0) {
      return new Response(JSON.stringify({ error: 'Agenda tidak ditemukan' }), { status: 404 });
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
      return new Response(JSON.stringify({ error: 'Sesi presensi untuk agenda ini sudah ditutup atau belum dimulai' }), { status: 403 });
    }

    const existing = await db.select().from(attendance).where(and(eq(attendance.pm_id, pmId), eq(attendance.agenda_id, agenda_id)));
    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: 'Anda sudah melakukan presensi untuk agenda ini' }), { status: 400 });
    }

    const id = `ATT-${Date.now()}`;
    const execution_date = new Date().toISOString().split('T')[0];

    await db.insert(attendance).values({
      id,
      agenda_id,
      pm_id: pmId,
      execution_date,
      timestamp: new Date()
    });

    return new Response(JSON.stringify({ message: 'Presensi berhasil dicatat' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit presensi' }), { status: 500 });
  }
}
