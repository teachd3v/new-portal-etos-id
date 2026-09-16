import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, attendance, agendas, periode_penilaian, reli_assessments, reli_consolidated } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user || (!user.role?.toUpperCase().includes('FASIL') && user.role?.toUpperCase() !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fasilRecords = await db.select().from(users).where(eq(users.id, user.id));
    if (!fasilRecords.length) return NextResponse.json({ error: 'Fasil not found' }, { status: 404 });
    const fasil = fasilRecords[0];

    // 1. Get Binaan (Etoser)
    let etosers = [];
    if (fasil.relasi_etoser && fasil.relasi_etoser.trim() !== '') {
      const relasiIds = fasil.relasi_etoser.split(',').map(id => id.trim()).filter(id => id !== '');
      if (relasiIds.length > 0) {
        etosers = await db.select({ id: users.id, name: users.name }).from(users).where(
          and(
            inArray(users.role, ['PM', 'Etoser', 'ETOSER']),
            inArray(users.id, relasiIds)
          )
        );
      }
    } 
    if (etosers.length === 0 && fasil.wilayah) {
      etosers = await db.select({ id: users.id, name: users.name }).from(users).where(
        and(
          inArray(users.role, ['PM', 'Etoser', 'ETOSER']),
          eq(users.wilayah, fasil.wilayah)
        )
      );
    }
    const totalBinaan = etosers.length;
    const etoserIds = etosers.map(e => e.id);

    // 2. Fetch Active RELI Period
    const openPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        eq(periode_penilaian.tipe_instrumen, 'RELI')
      )
    );
    const activePeriod = openPeriods[0] || null;
    const periodeKode = activePeriod?.kode_periode || 'T0';

    // 3. Stats calculation
    // Presensi
    let presensiBulanIni = 0;
    if (etoserIds.length > 0) {
       const attendances = await db.select().from(attendance).where(inArray(attendance.pm_id, etoserIds));
       presensiBulanIni = attendances.length > 0 ? Math.min(100, Math.round((attendances.length / (etoserIds.length * 4)) * 100)) : 0;
    }

    // RELI Peer Assessments completed by this fasil for binaan
    let peerCompleted = 0;
    let rataSkor = '-';
    if (etoserIds.length > 0 && activePeriod) {
       const facilAssessments = await db.select().from(reli_assessments).where(
         and(
           eq(reli_assessments.evaluator_type, 'FACILITATOR'),
           eq(reli_assessments.periode_kode, periodeKode),
           inArray(reli_assessments.user_id, etoserIds)
         )
       );
       peerCompleted = facilAssessments.length;

       if (facilAssessments.length > 0) {
         const totalScore = facilAssessments.reduce((acc, curr) => acc + (curr.overall_score || 0), 0);
         rataSkor = (totalScore / facilAssessments.length).toFixed(2);
       }
    }

    // Task List
    const periodLabel = activePeriod?.label || activePeriod?.kode_periode || 'Periode Aktif';
    const tasks = [
      { 
        title: `Penilaian Peer RELI Etoser Binaan`, 
        deadline: periodLabel, 
        type: "Penilaian RELI", 
        status: peerCompleted >= totalBinaan && totalBinaan > 0 ? "Selesai" : `Proses (${peerCompleted}/${totalBinaan})`, 
        icon: "ClipboardCheck",
        link: "/fasil/penilaian"
      },
      {
        title: "Monitoring Bulanan Etoser Binaan",
        deadline: "Rutin Bulanan",
        type: "Monitoring Binaan",
        status: "Aktif",
        icon: "FileCheck2",
        link: "/fasil/penilaian/binaan"
      },
      {
        title: "Penilaian Mandiri Fasilitator",
        deadline: "Rutin Bulanan",
        type: "Evaluasi Mandiri",
        status: "Aktif",
        icon: "ClipboardCheck",
        link: "/fasil/penilaian/mandiri"
      }
    ];

    const activeAgendas = await db.select().from(agendas).where(eq(agendas.is_active, true));
    if (activeAgendas.length > 0) {
      tasks.push({
        title: "Review Presensi Pembinaan",
        deadline: "Bulan Ini",
        type: "Presensi",
        status: "Aktif",
        icon: "Users",
        link: "/fasil/presensi"
      });
    }

    // 4. Fetch Real Activities
    const activities = [];
    if (etoserIds.length > 0) {
      const etoserNameMap = {};
      etosers.forEach(e => { etoserNameMap[e.id] = e.name; });

      const recentAssessments = await db.select().from(reli_assessments).where(
        and(
          eq(reli_assessments.evaluator_type, 'FACILITATOR'),
          inArray(reli_assessments.user_id, etoserIds)
        )
      );

      // Sort by timestamp desc
      recentAssessments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      for (const a of recentAssessments.slice(0, 6)) {
        const etoserName = etoserNameMap[a.user_id] || a.user_id;
        activities.push({
          id: `assess-${a.id}`,
          type: 'ASSESSMENT',
          title: `Menilai RELI: ${etoserName}`,
          description: `Skor: ${a.overall_score?.toFixed?.(2) || a.overall_score} • Periode ${a.periode_kode}`,
          timestamp: a.timestamp ? new Date(a.timestamp).toISOString() : new Date().toISOString(),
          icon: 'ClipboardCheck',
          color: 'orange'
        });
      }
    }

    return NextResponse.json({
      success: true,
      activePeriod,
      stats: {
        totalBinaan,
        presensiBulanIni,
        peerCompleted,
        rataSkor
      },
      tasks,
      activities
    });


  } catch (error) {
    console.error('Fasil Dashboard Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

