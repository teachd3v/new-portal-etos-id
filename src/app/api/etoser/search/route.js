import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agendas } from '@/db/schema';
import { like, or } from 'drizzle-orm';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    if (q.length < 2) return NextResponse.json({ results: [] });

    const searchPattern = `%${q}%`;

    // Static Navigation Menus for Etoser
    const staticMenus = [
      { type: 'Menu', label: 'Dashboard Etoser', url: '/etoser', subtitle: 'Halaman Utama & Radar RELI' },
      { type: 'Menu', label: 'Presensi Kegiatan & Agenda', url: '/etoser/presensi', subtitle: 'Catat & Konfirmasi Kehadiran' },
      { type: 'Menu', label: 'Penilaian Mandiri (RELI)', url: '/etoser/penilaian-mandiri', subtitle: 'Pengisian Asesmen Diri 64 Butir' },
      { type: 'Menu', label: 'Profil Saya', url: '/etoser/profil', subtitle: 'Biodata & Data Akademik' },
      { type: 'Menu', label: 'Portofolio Etoser', url: '/etoser/profil', subtitle: 'Prestasi, Organisasi & Karya' },
    ].filter(menu => menu.label.toLowerCase().includes(q.toLowerCase()));

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
    foundAgendas.forEach(a => results.push({
      type: 'Agenda',
      title: a.name,
      subtitle: `${a.type} • ${a.start_date || 'Terjadwal'}`,
      url: '/etoser/presensi'
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
