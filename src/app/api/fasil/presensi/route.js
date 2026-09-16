import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, agendas, attendance, post_test_questions, post_test_attempts } from '@/db/schema';
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
      wilayah: users.wilayah
    }).from(users).where(
      and(
        inArray(users.role, ['PM', 'Etoser']),
        eq(users.wilayah, fasil.wilayah)
      )
    );

    const etoserIds = etosers.map(e => e.id);

    // 3. Get active agendas for ETOSER or SEMUA
    const activeAgendas = await db.select().from(agendas).where(
      and(
        eq(agendas.is_active, true),
        or(
          eq(agendas.target_role, 'ETOSER'),
          eq(agendas.target_role, 'SEMUA'),
          isNull(agendas.target_role)
        )
      )
    );

    // 4. Get attendance for these etosers and agendas
    let attendanceRecords = [];
    if (etoserIds.length > 0 && activeAgendas.length > 0) {
      attendanceRecords = await db.select().from(attendance).where(
        and(
          inArray(attendance.pm_id, etoserIds),
          inArray(attendance.agenda_id, activeAgendas.map(a => a.id))
        )
      );
    }

    // 5. Structure data for binaan monitoring
    const summary = activeAgendas.map(agenda => {
      const attendees = attendanceRecords.filter(a => a.agenda_id === agenda.id).map(a => a.pm_id);
      
      const etoserStatus = etosers.map(etoser => ({
        ...etoser,
        hadir: attendees.includes(etoser.id)
      }));

      return {
        agenda: agenda,
        totalEtoser: etosers.length,
        totalHadir: attendees.length,
        etoserStatus: etoserStatus
      };
    });

    // 6. Get active agendas targeted to FASILITATOR or SEMUA
    const fasilAgendasRaw = await db.select().from(agendas).where(
      and(
        eq(agendas.is_active, true),
        or(
          eq(agendas.target_role, 'FASILITATOR'),
          eq(agendas.target_role, 'SEMUA')
        )
      )
    );

    // Get Fasil's own attendance records
    const fasilAttendance = await db.select().from(attendance).where(eq(attendance.pm_id, decoded.id));
    const attendedFasilAgendaIds = fasilAttendance.map(a => a.agenda_id);

    // Fetch all post test questions to check if kuis exists
    const questions = await db.select().from(post_test_questions);
    
    // Fetch attempts for this Fasil user
    const attempts = await db.select().from(post_test_attempts).where(eq(post_test_attempts.user_id, decoded.id));

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

      const hasPostTest = questions.some(q => q.agenda_id === agenda.id);
      const attempt = attempts.find(a => a.agenda_id === agenda.id);

      return {
        ...agenda,
        hasAttended: attendedFasilAgendaIds.includes(agenda.id),
        is_open_now,
        hasPostTest,
        hasTakenPostTest: !!attempt,
        postTestScore: attempt ? Math.round(attempt.score) : null
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: summary,
      fasilAgendas: fasilAgendas 
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
