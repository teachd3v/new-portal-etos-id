import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, instrumen_fasil, periode_penilaian, reports, report_answers, app_settings } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { verifyJwt } from '@/lib/auth';

import crypto from 'crypto';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('cookie');
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyJwt(token);
    if (!decoded || !decoded.role.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fasilRecords = await db.select().from(users).where(eq(users.id, decoded.id));
    if (!fasilRecords.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const fasil = fasilRecords[0];

    // 1. Fetch app_settings to determine Auto Period
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

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    let targetMonthName = monthNames[targetMonth - 1] || 'September';

    // 2. Check manual override from periode_penilaian specifically for Fasil Monev
    const manualPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        inArray(periode_penilaian.tipe_instrumen, ['Self-Fasil', 'Monev-Fasil'])
      )
    );
    if (manualPeriods.length > 0) {
      isOpen = true;
      targetMonthName = manualPeriods[0].bulan || targetMonthName;
      targetYear = manualPeriods[0].tahun ? parseInt(manualPeriods[0].tahun, 10) : targetYear;
    }

    if (!isOpen) {
      return NextResponse.json({ 
        success: true, 
        isOpen: false,
        activePeriod: null,
        schedule: {
          start,
          end,
          currentDay,
          message: `Pengisian penilaian mandiri Fasilitator dibuka setiap tanggal ${start} s.d tanggal ${end}.`
        },
        isSubmitted: false, 
        questions: [] 
      });
    }

    const activePeriod = {
      id: `PER-FASIL-${targetYear}-${targetMonth}`,
      bulan: targetMonthName,
      tahun: targetYear.toString(),
      label: `${targetMonthName} ${targetYear}`
    };

    const existingReports = await db.select().from(reports).where(
      and(
        eq(reports.type, 'FASIL_SELF_ASSESSMENT'),
        eq(reports.period_month, activePeriod.bulan),
        eq(reports.period_year, activePeriod.tahun),
        eq(reports.user_id, fasil.id)
      )
    );

    const isSubmitted = existingReports.length > 0;

    let questions = [];
    if (!isSubmitted) {
      const fasilRole = fasil.fasil_role || 'Reguler';
      questions = await db.select().from(instrumen_fasil).where(eq(instrumen_fasil.role, fasilRole));
      if (questions.length === 0) {
        questions = await db.select().from(instrumen_fasil);
      }
    }

    return NextResponse.json({ 
      success: true, 
      isOpen: true,
      activePeriod,
      schedule: {
        start,
        end,
        currentDay
      },
      isSubmitted,
      questions
    });

  } catch (error) {
    console.error(error);
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

    // Check if period is currently open
    const settingsRes = await db.select().from(app_settings);
    const startStr = settingsRes.find(s => s.key === 'periode_fasil_start')?.value || '25';
    const endStr = settingsRes.find(s => s.key === 'periode_fasil_end')?.value || '7';

    let isOpen = false;
    const today = new Date();
    const currentDay = today.getDate();
    const start = parseInt(startStr, 10) || 25;
    const end = parseInt(endStr, 10) || 7;

    if (start <= end) {
      if (currentDay >= start && currentDay <= end) isOpen = true;
    } else {
      if (currentDay >= start || currentDay <= end) isOpen = true;
    }

    const manualPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        inArray(periode_penilaian.tipe_instrumen, ['Self-Fasil', 'Monev-Fasil'])
      )
    );
    if (manualPeriods.length > 0) isOpen = true;

    if (!isOpen) {
      return NextResponse.json({ 
        error: `Periode penilaian mandiri saat ini sedang ditutup. Pengisian dibuka setiap tanggal ${start} s.d tanggal ${end}.` 
      }, { status: 403 });
    }

    const body = await req.json();
    const { answers, validations, period_month, period_year } = body;

    const reportId = `RPT-SELF-FASIL-${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date();

    await db.insert(reports).values({
      id: reportId,
      user_id: decoded.id,
      type: 'FASIL_SELF_ASSESSMENT',
      period_month,
      period_year,
      timestamp
    });

    const answersData = Object.keys(answers).map(kode => ({
      id: `ANS-${crypto.randomBytes(4).toString('hex')}`,
      report_id: reportId,
      question_code: kode,
      score: answers[kode],
      value: validations[kode] || null
    }));

    if (answersData.length > 0) {
      await db.insert(report_answers).values(answersData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

