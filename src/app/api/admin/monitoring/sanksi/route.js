import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, sanksi_user, katalog_sanksi } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

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
    if (!authUser || authUser.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const currentMonthName = MONTH_NAMES[now.getMonth()];
    const currentYear = now.getFullYear().toString();

    const bulan = searchParams.get('bulan') || currentMonthName; // 'all' or month name
    const tahun = searchParams.get('tahun') || currentYear;
    const wilayah = searchParams.get('wilayah') || 'all';
    const angkatan = searchParams.get('angkatan') || 'all';
    const kategori = searchParams.get('kategori') || 'all';

    const allUsers = await db.select().from(users);
    const allSanksi = await db.select().from(sanksi_user);
    const allKatalog = await db.select().from(katalog_sanksi);

    const userMap = {};
    allUsers.forEach(u => { userMap[u.id] = u; });

    const katalogMap = {};
    allKatalog.forEach(k => { katalogMap[k.id] = k; });

    const etoserList = allUsers
      .filter(u => u.role?.toUpperCase() === 'ETOSER' || u.role?.toUpperCase() === 'PM')
      .map(u => ({
        id: u.id,
        name: u.name,
        wilayah: u.wilayah || '-',
        angkatan: u.angkatan || '-'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Enrich and filter sanksi rows
    const enrichedCases = allSanksi
      .map(s => {
        const etoser = userMap[s.user_id] || {};
        const fasil = userMap[s.fasil_id] || {};
        const cat = katalogMap[s.katalog_sanksi_id] || {};

        return {
          id: s.id,
          etoserId: s.user_id,
          etoserName: etoser.name || 'Etoser',
          wilayah: etoser.wilayah || '-',
          angkatan: etoser.angkatan || '-',
          fasilId: s.fasil_id,
          fasilName: fasil.name || (s.fasil_id === authUser.id ? 'Admin Pusat' : 'Fasilitator'),
          katalogSanksiId: s.katalog_sanksi_id,
          kategori: cat.kategori || 'Lainnya',
          detailPelanggaran: cat.detail_pelanggaran || 'Pelanggaran',
          masaPerbaikan: cat.masa_perbaikan || '-',
          poin: Number(s.poin ?? cat.poin ?? 0),
          creditPerform: cat.credit_perform || '0%',
          keterangan: s.keterangan || '-',
          status: s.status || 'APPROVED',
          periodMonth: s.period_month || '-',
          periodYear: s.period_year || '-',
          timestamp: s.timestamp
        };
      })
      .filter(row => {
        if (tahun !== 'all' && row.periodYear !== tahun) return false;
        if (bulan !== 'all' && row.periodMonth !== bulan) return false;
        if (wilayah !== 'all' && row.wilayah !== wilayah) return false;
        if (angkatan !== 'all' && row.angkatan !== angkatan) return false;
        if (kategori !== 'all' && row.kategori !== kategori) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    // Group by Etoser + Period for Finance / Credit Deduction Summary
    const groupedMap = {};
    enrichedCases.forEach(c => {
      const groupKey = `${c.etoserId}_${c.periodMonth}_${c.periodYear}`;
      if (!groupedMap[groupKey]) {
        groupedMap[groupKey] = {
          groupKey,
          etoserId: c.etoserId,
          etoserName: c.etoserName,
          wilayah: c.wilayah,
          angkatan: c.angkatan,
          periodMonth: c.periodMonth,
          periodYear: c.periodYear,
          totalKasus: 0,
          totalPoin: 0,
          cases: []
        };
      }
      groupedMap[groupKey].totalKasus += 1;
      groupedMap[groupKey].totalPoin += Number(c.poin) || 0;
      groupedMap[groupKey].cases.push({
        ...c,
        credit_perform: c.creditPerform
      });
    });

    const summaryByEtoser = Object.values(groupedMap)
      .map(g => ({
        ...g,
        totalCreditDeduction: summarizeCreditPerform(g.cases),
        pelanggaranRingkas: g.cases.map(x => `${x.detailPelanggaran} (${x.poin} Poin / ${x.creditPerform})`).join('; ')
      }))
      .sort((a, b) => b.totalPoin - a.totalPoin);

    const uniqueEtoserCount = new Set(enrichedCases.map(c => c.etoserId)).size;
    const totalPoinSum = enrichedCases.reduce((acc, c) => acc + (Number(c.poin) || 0), 0);
    const heavyCasesCount = summaryByEtoser.filter(g => {
      if (g.totalCreditDeduction === 'DO') return true;
      const pct = parseFloat(String(g.totalCreditDeduction).replace('%', ''));
      return !isNaN(pct) && pct >= 30;
    }).length;

    return NextResponse.json({
      success: true,
      stats: {
        etoserKenaSanksi: uniqueEtoserCount,
        totalKasus: enrichedCases.length,
        totalPoin: totalPoinSum,
        kasusBeratAtauDO: heavyCasesCount
      },
      cases: enrichedCases,
      summaryByEtoser,
      katalogSanksi: allKatalog,
      etoserOptions: etoserList
    });
  } catch (error) {
    console.error('Admin Monitoring Sanksi GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { user_id, katalog_sanksi_id, keterangan, period_month, period_year } = body;

    if (!user_id || !katalog_sanksi_id || !period_month || !period_year) {
      return NextResponse.json(
        { error: 'Etoser, jenis pelanggaran, dan periode bulan/tahun wajib diisi.' },
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

    await db.insert(sanksi_user).values({
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
    });

    return NextResponse.json({
      success: true,
      message: 'Data sanksi berhasil ditambahkan.'
    });
  } catch (error) {
    console.error('Admin Monitoring Sanksi POST Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan sanksi' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID sanksi wajib disertakan.' }, { status: 400 });
    }

    await db.delete(sanksi_user).where(eq(sanksi_user.id, id));

    return NextResponse.json({
      success: true,
      message: 'Data sanksi berhasil dihapus.'
    });
  } catch (error) {
    console.error('Admin Monitoring Sanksi DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus sanksi' }, { status: 500 });
  }
}
