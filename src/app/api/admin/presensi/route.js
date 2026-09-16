import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, agendas, attendance, post_test_attempts } from '@/db/schema';
import { eq, inArray, and, or, isNull } from 'drizzle-orm';
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

    // 2. Get active agendas
    const activeAgendas = await db.select().from(agendas).where(eq(agendas.is_active, true));
    const activeAgendaIds = activeAgendas.map(a => a.id);

    // 3. Get attendance for active agendas
    let attendanceRecords = [];
    if (activeAgendaIds.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < activeAgendaIds.length; i += chunkSize) {
        const chunk = activeAgendaIds.slice(i, i + chunkSize);
        const records = await db.select().from(attendance).where(inArray(attendance.agenda_id, chunk));
        attendanceRecords = [...attendanceRecords, ...records];
      }
    }

    // 4. Get post-test attempts for active agendas
    let attemptRecords = [];
    if (activeAgendaIds.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < activeAgendaIds.length; i += chunkSize) {
        const chunk = activeAgendaIds.slice(i, i + chunkSize);
        const records = await db.select().from(post_test_attempts).where(inArray(post_test_attempts.agenda_id, chunk));
        attemptRecords = [...attemptRecords, ...records];
      }
    }

    // 5. Structure data based on target_role of each agenda
    const summary = activeAgendas.map(agenda => {
      // Filter target users based on agenda's target role
      let targetUsers = [];
      const roleTarget = agenda.target_role || 'ETOSER';
      if (roleTarget === 'FASILITATOR') {
        targetUsers = allUsers.filter(u => u.role && u.role.toUpperCase().includes('FASIL'));
      } else if (roleTarget === 'SEMUA') {
        targetUsers = allUsers;
      } else {
        // default to ETOSER
        targetUsers = allUsers.filter(u => u.role && !u.role.toUpperCase().includes('FASIL'));
      }

      const attendees = attendanceRecords.filter(a => a.agenda_id === agenda.id).map(a => a.pm_id);
      const agendaAttempts = attemptRecords.filter(a => a.agenda_id === agenda.id);
      
      const participantStatus = targetUsers.map(user => {
        const attempt = agendaAttempts.find(a => a.user_id === user.id);
        return {
          ...user,
          hadir: attendees.includes(user.id),
          hasTakenPostTest: !!attempt,
          postTestScore: attempt ? Math.round(attempt.score) : null
        };
      });

      return {
        agenda: agenda,
        totalEtoser: targetUsers.length, // total target participants
        totalHadir: participantStatus.filter(e => e.hadir).length,
        etoserStatus: participantStatus // keep key as etoserStatus for UI compatibility
      };
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Admin Presensi Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
