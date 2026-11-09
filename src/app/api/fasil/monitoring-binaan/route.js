import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  reports,
  report_answers,
  instrumen_etoser,
  profil_user,
  katalog_sanksi,
  sanksi_user,
  app_settings,
  periode_penilaian
} from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

async function getMonitoringPeriodSchedule() {
  const settingsRes = await db.select().from(app_settings);
  const startStr = settingsRes.find(s => s.key === 'periode_fasil_start')?.value || '25';
  const endStr = settingsRes.find(s => s.key === 'periode_fasil_end')?.value || '7';

  let isOpen = false;
  const today = new Date();
  const currentDay = today.getDate();
  let targetMonth = today.getMonth() + 1;
  let targetYear = today.getFullYear();

  const start = parseInt(startStr, 10) || 25;
  const end = parseInt(endStr, 10) || 7;

  if (start <= end) {
    if (currentDay >= start && currentDay <= end) {
      isOpen = true;
    }
  } else {
    // Cross-month: e.g. 25th of this month to 7th of next month
    if (currentDay >= start) {
      isOpen = true;
    } else if (currentDay <= end) {
      isOpen = true;
      targetMonth -= 1;
      if (targetMonth === 0) {
        targetMonth = 12;
        targetYear -= 1;
      }
    }
  }

  let targetMonthName = MONTH_NAMES[targetMonth - 1] || MONTH_NAMES[today.getMonth()];

  const manualPeriods = await db.select().from(periode_penilaian).where(
    and(
      eq(periode_penilaian.is_open, true),
      inArray(periode_penilaian.tipe_instrumen, ['Self-Fasil', 'Monev-Fasil', 'Self-Etoser', 'Monev-Etoser'])
    )
  );
  if (manualPeriods.length > 0) {
    isOpen = true;
    targetMonthName = manualPeriods[0].bulan || targetMonthName;
    targetYear = manualPeriods[0].tahun ? parseInt(manualPeriods[0].tahun, 10) : targetYear;
  }

  return {
    isOpen,
    start,
    end,
    currentDay,
    activeMonth: targetMonthName,
    activeYear: targetYear.toString(),
    message: isOpen
      ? `Periode input Monitoring Bulanan & Usulan Sanksi sedang dibuka (Tgl ${start} s/d Tgl ${end}).`
      : `Periode input Usulan Sanksi terkunci di luar jadwal Monitoring Bulanan (Jadwal buka: Tgl ${start} s/d Tgl ${end} setiap bulan).`
  };
}

function summarizeCreditPerform(sanksiItems) {
  if (!sanksiItems || sanksiItems.length === 0) return '0%';
  let hasDO = false;
  let totalPercent = 0;

  for (const item of sanksiItems) {
    const raw = String(item.credit_perform || '').trim().toUpperCase();
    if (raw === 'DO' || raw.includes('DO')) {
      hasDO = true;
    } else {
      const num = parseFloat(raw.replace('%', '').trim());
      if (!isNaN(num)) {
        totalPercent += num;
      }
    }
  }

  if (hasDO) return 'DO';
  return `${Math.min(100, totalPercent)}%`;
}

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

    const schedule = await getMonitoringPeriodSchedule();

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultMonth = schedule.isOpen ? schedule.activeMonth : MONTH_NAMES[now.getMonth()];
    const defaultYear = schedule.isOpen ? schedule.activeYear : now.getFullYear().toString();

    const bulan = searchParams.get('bulan') || defaultMonth;
    const tahun = searchParams.get('tahun') || defaultYear;

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
    const binaanIdSet = new Set(binaanIds);

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
      relevantReports = allReports.filter(r => binaanIdSet.has(r.user_id));
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

    // 5. Fetch Katalog Sanksi & Sanksi User for this period
    const katalogSanksi = await db.select().from(katalog_sanksi);
    const catalogMap = {};
    katalogSanksi.forEach(k => { catalogMap[k.id] = k; });

    const periodSanksi = await db.select().from(sanksi_user).where(
      and(
        eq(sanksi_user.period_month, bulan),
        eq(sanksi_user.period_year, tahun)
      )
    );

    const sanksiByUser = {};
    periodSanksi
      .filter(s => binaanIdSet.has(s.user_id))
      .forEach(s => {
        if (!sanksiByUser[s.user_id]) sanksiByUser[s.user_id] = [];
        const cat = catalogMap[s.katalog_sanksi_id] || {};
        sanksiByUser[s.user_id].push({
          id: s.id,
          user_id: s.user_id,
          fasil_id: s.fasil_id,
          katalog_sanksi_id: s.katalog_sanksi_id,
          kategori: cat.kategori || 'Lainnya',
          detail_pelanggaran: cat.detail_pelanggaran || 'Pelanggaran',
          masa_perbaikan: cat.masa_perbaikan || '-',
          poin: Number(s.poin ?? cat.poin ?? 0),
          credit_perform: cat.credit_perform || '-',
          keterangan: s.keterangan || '',
          status: s.status || 'APPROVED',
          period_month: s.period_month,
          period_year: s.period_year,
          timestamp: s.timestamp
        });
      });

    let totalScoresSum = 0;
    let submittedCount = 0;
    let etoserKenaSanksiCount = 0;
    let totalKasusSanksi = 0;

    const table = binaanList.map(e => {
      const report = reportByUser[e.id];
      const hasSubmitted = !!report;
      const answers = report ? (answersByReport[report.id] || []) : [];
      const prof = profileMap[e.id] || {};
      const userSanksi = sanksiByUser[e.id] || [];

      if (userSanksi.length > 0) {
        etoserKenaSanksiCount++;
        totalKasusSanksi += userSanksi.length;
      }

      const totalPoinSanksi = userSanksi.reduce((acc, item) => acc + (Number(item.poin) || 0), 0);
      const totalCreditDeduction = summarizeCreditPerform(userSanksi);

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
        totalAnswers: answers.length,
        sanksiList: userSanksi,
        totalPoinSanksi,
        totalCreditDeduction
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
      schedule,
      katalogSanksi,
      stats: {
        totalBinaan: binaanList.length,
        sudahMengisi: submittedCount,
        belumMengisi: binaanList.length - submittedCount,
        persentase: binaanList.length > 0 ? Math.round((submittedCount / binaanList.length) * 100) : 0,
        rataRataSkor: overallAvg,
        etoserKenaSanksi: etoserKenaSanksiCount,
        totalKasusSanksi
      },
      table
    });

  } catch (error) {
    console.error('Fasil Monitoring Binaan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !authUser.role?.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedule = await getMonitoringPeriodSchedule();
    if (!schedule.isOpen) {
      return NextResponse.json(
        { error: schedule.message },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { user_id, katalog_sanksi_id, keterangan, period_month, period_year } = body;

    if (!user_id || !katalog_sanksi_id || !period_month || !period_year) {
      return NextResponse.json(
        { error: 'Data Etoser, jenis pelanggaran, dan periode bulan/tahun wajib diisi.' },
        { status: 400 }
      );
    }

    const catalogItems = await db
      .select()
      .from(katalog_sanksi)
      .where(eq(katalog_sanksi.id, katalog_sanksi_id));

    if (catalogItems.length === 0) {
      return NextResponse.json({ error: 'Item katalog sanksi tidak ditemukan.' }, { status: 404 });
    }

    const catalogItem = catalogItems[0];
    const sanksiId = `SNK-${crypto.randomBytes(4).toString('hex')}`;

    const newRecord = {
      id: sanksiId,
      user_id,
      fasil_id: authUser.id,
      katalog_sanksi_id: catalogItem.id,
      poin: Number(catalogItem.poin) || 0,
      keterangan: keterangan?.trim() || null,
      status: 'APPROVED',
      period_month: String(period_month),
      period_year: String(period_year),
      timestamp: new Date()
    };

    await db.insert(sanksi_user).values(newRecord);

    return NextResponse.json({
      success: true,
      message: 'Usulan sanksi berhasil ditambahkan.',
      data: {
        ...newRecord,
        kategori: catalogItem.kategori,
        detail_pelanggaran: catalogItem.detail_pelanggaran,
        masa_perbaikan: catalogItem.masa_perbaikan,
        credit_perform: catalogItem.credit_perform
      }
    });
  } catch (error) {
    console.error('Fasil Monitoring Sanksi POST Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan sanksi' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !authUser.role?.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedule = await getMonitoringPeriodSchedule();
    if (!schedule.isOpen) {
      return NextResponse.json(
        { error: schedule.message },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID sanksi wajib disertakan.' }, { status: 400 });
    }

    const existing = await db.select().from(sanksi_user).where(eq(sanksi_user.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Data sanksi tidak ditemukan.' }, { status: 404 });
    }

    await db.delete(sanksi_user).where(eq(sanksi_user.id, id));

    return NextResponse.json({
      success: true,
      message: 'Data sanksi berhasil dihapus.'
    });
  } catch (error) {
    console.error('Fasil Monitoring Sanksi DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus sanksi' }, { status: 500 });
  }
}
