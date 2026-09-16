import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, reports, report_answers, instrumen_fasil, catatan_admin } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    // 1. Fetch Fasil User
    const userList = await db.select().from(users).where(eq(users.id, id));
    if (userList.length === 0) {
      return NextResponse.json({ error: 'Fasilitator tidak ditemukan' }, { status: 404 });
    }
    const fasil = userList[0];

    // 2. Fetch Period info
    const today = new Date();
    const targetMonth = today.getMonth() + 1;
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonthName = monthNames[targetMonth - 1];
    const currentYearStr = today.getFullYear().toString();

    // 3. Fetch Self Assessment Report for Fasil
    const selfReports = await db.select().from(reports).where(
      and(
        eq(reports.user_id, id),
        eq(reports.type, 'FASIL_SELF_ASSESSMENT'),
        eq(reports.period_month, currentMonthName),
        eq(reports.period_year, currentYearStr)
      )
    );
    const selfReport = selfReports[0];

    // Fetch Answers for Fasil Self Assessment
    let selfAnswers = [];
    if (selfReport) {
      selfAnswers = await db.select().from(report_answers).where(eq(report_answers.report_id, selfReport.id));
    }

    // Fetch Questions
    const instQuestions = await db.select().from(instrumen_fasil);
    const fasilRole = fasil.fasil_role || 'Reguler';
    const selfDetails = instQuestions
      .filter(q => q.role === fasilRole || q.role === 'All' || q.role === 'all')
      .map(q => {
        const ans = selfAnswers.find(a => a.question_code === q.kode);
        return {
          id: q.id,
          kode: q.kode,
          item_pernyataan: q.item_pernyataan,
          score: ans ? ans.score : null,
          value: ans ? ans.value : '-'
        };
      });

    // 4. Fetch Relasi Binaan (Etoser)
    const allUsers = await db.select().from(users);
    let binaanIds = [];
    if (fasil.relasi_etoser && fasil.relasi_etoser.trim() !== '') {
      binaanIds = fasil.relasi_etoser.split(',').map(idStr => idStr.trim()).filter(Boolean);
    } else {
      binaanIds = allUsers.filter(u => (u.role === 'Etoser' || u.role === 'PM') && u.wilayah === fasil.wilayah).map(u => u.id);
    }

    let binaanList = [];
    if (binaanIds.length > 0) {
      const dbBinaan = allUsers.filter(u => binaanIds.includes(u.id));
      
      // Get all peer assessment reports in current period
      const peerReports = await db.select().from(reports).where(
        and(
          eq(reports.type, 'FASIL_PEER_ASSESSMENT'),
          eq(reports.period_month, currentMonthName),
          eq(reports.period_year, currentYearStr)
        )
      );

      binaanList = dbBinaan.map(b => {
        const hasPeer = peerReports.some(r => r.user_id === b.id);
        return {
          id: b.id,
          name: b.name,
          wilayah: b.wilayah || '-',
          angkatan: b.angkatan || '-',
          statusPeer: hasPeer ? 'Sudah Di-Peer' : 'Belum Di-Peer'
        };
      });
    }

    // 5. Fetch Admin Note
    const adminNotes = await db.select().from(catatan_admin).where(
      and(
        eq(catatan_admin.target_user_id, id),
        eq(catatan_admin.period_month, currentMonthName),
        eq(catatan_admin.period_year, currentYearStr)
      )
    );
    const currentNote = adminNotes[0]?.catatan || '';

    return NextResponse.json({
      success: true,
      fasil: {
        id: fasil.id,
        name: fasil.name,
        role: fasil.role,
        fasil_role: fasilRole,
        wilayah: fasil.wilayah || '-',
      },
      period: {
        month: currentMonthName,
        year: currentYearStr
      },
      selfAssessment: selfDetails,
      binaan: binaanList,
      catatanAdmin: currentNote
    });

  } catch (error) {
    console.error('Fetch Fasil Details Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
