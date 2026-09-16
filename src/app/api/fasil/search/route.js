import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agendas, users } from '@/db/schema';
import { like, or, and, inArray } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    if (q.length < 2) return NextResponse.json({ results: [] });

    const searchPattern = `%${q}%`;

    // Static Navigation Menus for Fasilitator
    const staticMenus = [
      { type: 'Menu', label: 'Dashboard Fasilitator', url: '/fasil', subtitle: 'Pusat Pantauan & Summary Binaan' },
      { type: 'Menu', label: 'Presensi Mandiri Fasilitator', url: '/fasil/presensi?tab=self', subtitle: 'Catat Presensi Fasil' },
      { type: 'Menu', label: 'Pemantauan Presensi Binaan', url: '/fasil/presensi?tab=monitoring', subtitle: 'Verifikasi Kehadiran Etoser' },
      { type: 'Menu', label: 'Penilaian Peer Etoser (RELI)', url: '/fasil/penilaian', subtitle: 'Daftar Etoser & Input Nilai 64 Butir' },
      { type: 'Menu', label: 'Penilaian Mandiri Fasil', url: '/fasil/penilaian/mandiri', subtitle: 'Asesmen Diri Fasilitator' },
      { type: 'Menu', label: 'Profil Fasilitator', url: '/fasil/profil', subtitle: 'Biodata Fasilitator' },
      { type: 'Menu', label: 'Portofolio Fasilitator', url: '/fasil/profil/portofolio', subtitle: 'Karya & Laporan Pembinaan' },
    ].filter(menu => menu.label.toLowerCase().includes(q.toLowerCase()));

    // Search Binaan (Etoser)
    const foundEtosers = await db.select({
      id: users.id,
      name: users.name,
      angkatan: users.angkatan,
      wilayah: users.wilayah,
      fase: users.fase
    }).from(users).where(
      and(
        inArray(users.role, ['Etoser', 'PM', 'ETOSER']),
        or(
          like(users.name, searchPattern),
          like(users.id, searchPattern)
        )
      )
    ).limit(5);

    // Search Agendas
    const foundAgendas = await db.select({
      id: agendas.id,
      name: agendas.name,
      theme: agendas.theme,
      type: agendas.type,
      start_date: agendas.start_date
    }).from(agendas).where(or(
      like(agendas.name, searchPattern),
      like(agendas.theme, searchPattern)
    )).limit(5);

    const results = [];
    staticMenus.forEach(m => results.push({ type: 'Menu', title: m.label, subtitle: m.subtitle, url: m.url }));
    
    foundEtosers.forEach(e => results.push({
      type: 'User',
      title: `${e.name} (${e.id})`,
      subtitle: `Penilaian Peer • ${e.fase || 'T0'} • ${e.wilayah || 'Pusat'}`,
      url: `/fasil/penilaian/${e.id}`
    }));

    foundAgendas.forEach(a => results.push({
      type: 'Agenda',
      title: a.name,
      subtitle: `${a.type} • ${a.start_date || 'Terjadwal'}`,
      url: '/fasil/presensi'
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
