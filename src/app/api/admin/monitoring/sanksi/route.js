import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, sanksi_user, katalog_sanksi } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function summarizeCreditPerform(sanksiItems) {
  const validItems = (sanksiItems || []).filter(item => item.status !== 'REJECTED');
  if (validItems.length === 0) return '0%';
  let hasDO = false;
  let totalPercent = 0;

  for (const item of validItems) {
    const raw = String(item.credit_perform || item.creditPerform || '').trim().toUpperCase();
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
    const statusFilter = searchParams.get('status') || 'all';

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
        const isInputByAdmin = fasil.role?.toUpperCase() === 'ADMIN' || s.fasil_id === authUser.id;

        return {
          id: s.id,
          etoserId: s.user_id,
          etoserName: etoser.name || 'Etoser',
          wilayah: etoser.wilayah || '-',
          angkatan: etoser.angkatan || '-',
          fasilId: s.fasil_id,
          fasilName: isInputByAdmin ? `Admin (${fasil.name || 'Pusat'})` : (fasil.name || 'Fasilitator'),
          isInputByAdmin,
          katalogSanksiId: s.katalog_sanksi_id,
          kategori: cat.kategori || 'Lainnya',
          detailPelanggaran: cat.detail_pelanggaran || 'Pelanggaran',
          masaPerbaikan: cat.masa_perbaikan || '-',
          poin: Number(s.poin ?? cat.poin ?? 0),
          creditPerform: cat.credit_perform || '0%',
          keterangan: s.keterangan || '-',
          status: s.status || 'PENDING',
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
        if (statusFilter !== 'all' && row.status !== statusFilter) return false;
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
          pendingCount: 0,
          approvedCount: 0,
          totalPoin: 0,
          approvedPoin: 0,
          cases: []
        };
      }
      groupedMap[groupKey].totalKasus += 1;
      if (c.status === 'PENDING') groupedMap[groupKey].pendingCount += 1;
      if (c.status === 'APPROVED') {
        groupedMap[groupKey].approvedCount += 1;
        groupedMap[groupKey].approvedPoin += Number(c.poin) || 0;
      }
      if (c.status !== 'REJECTED') {
        groupedMap[groupKey].totalPoin += Number(c.poin) || 0;
      }
      groupedMap[groupKey].cases.push({
        ...c,
        credit_perform: c.creditPerform
      });
    });

    const summaryByEtoser = Object.values(groupedMap)
      .map(g => {
        const activeCases = g.cases.filter(x => x.status !== 'REJECTED');
        const approvedCases = g.cases.filter(x => x.status === 'APPROVED');
        return {
          ...g,
          totalCreditDeduction: summarizeCreditPerform(activeCases),
          approvedCreditDeduction: summarizeCreditPerform(approvedCases),
          pelanggaranRingkas: activeCases
            .map(x => `[${x.status === 'APPROVED' ? 'Terverifikasi' : 'Menunggu'}] ${x.detailPelanggaran} (${x.poin} Poin / ${x.creditPerform})`)
            .join('; ')
        };
      })
      .sort((a, b) => b.totalPoin - a.totalPoin);

    const activeCasesAll = enrichedCases.filter(c => c.status !== 'REJECTED');
    const uniqueEtoserCount = new Set(activeCasesAll.map(c => c.etoserId)).size;
    const pendingCasesCount = enrichedCases.filter(c => c.status === 'PENDING').length;
    const totalPoinSum = activeCasesAll.reduce((acc, c) => acc + (Number(c.poin) || 0), 0);
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
        menungguVerifikasi: pendingCasesCount,
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
      message: 'Sanksi berhasil ditambahkan dan langsung terverifikasi.'
    });
  } catch (error) {
    console.error('Admin Monitoring Sanksi POST Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan sanksi' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ids, status, katalog_sanksi_id, keterangan } = body;

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Status verifikasi tidak valid.' }, { status: 400 });
    }

    // Support bulk verification (e.g. Approve all pending for an Etoser or period)
    if (Array.isArray(ids) && ids.length > 0) {
      await db.update(sanksi_user).set({ status }).where(inArray(sanksi_user.id, ids));
      return NextResponse.json({
        success: true,
        message: `${ids.length} usulan sanksi berhasil diperbarui ke status ${status}.`
      });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID sanksi wajib disertakan.' }, { status: 400 });
    }

    const updateValues = { status };

    if (katalog_sanksi_id) {
      const catalogItems = await db
        .select()
        .from(katalog_sanksi)
        .where(eq(katalog_sanksi.id, katalog_sanksi_id));
      if (catalogItems.length > 0) {
        updateValues.katalog_sanksi_id = catalogItems[0].id;
        updateValues.poin = Number(catalogItems[0].poin) || 0;
      }
    }

    if (keterangan !== undefined) {
      updateValues.keterangan = keterangan?.trim() || null;
    }

    await db.update(sanksi_user).set(updateValues).where(eq(sanksi_user.id, id));

    return NextResponse.json({
      success: true,
      message: status === 'APPROVED'
        ? 'Usulan sanksi berhasil diverifikasi & disetujui!'
        : status === 'REJECTED'
          ? 'Usulan sanksi telah ditolak.'
          : 'Status sanksi diperbarui.'
    });
  } catch (error) {
    console.error('Admin Monitoring Sanksi PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memverifikasi sanksi' }, { status: 500 });
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
