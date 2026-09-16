import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, agendas } from '@/db/schema';
import { like, or } from 'drizzle-orm';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    if (q.length < 2) return NextResponse.json({ results: [] });

    const searchPattern = `%${q}%`;

    // Static Navigation Menus matching
    const staticMenus = [
      { type: 'Menu', label: 'Dashboard Monitoring', url: '/admin' },
      { type: 'Menu', label: 'Monitoring Etoser', url: '/admin?tab=etoser' },
      { type: 'Menu', label: 'Monitoring Fasilitator', url: '/admin?tab=fasil' },
      { type: 'Menu', label: 'Monitoring Sanksi Pembinaan', url: '/admin/dashboard/sanksi' },
      { type: 'Menu', label: 'Manajemen Pengguna (User)', url: '/admin/users' },
      { type: 'Menu', label: 'Manajemen Agenda & Kegiatan', url: '/admin/agendas?tab=agenda' },
      { type: 'Menu', label: 'Presensi Kehadiran', url: '/admin/agendas?tab=presensi' },
      { type: 'Menu', label: 'Pengaturan Sistem & Periode Asesmen', url: '/admin/settings?tab=system' },
      { type: 'Menu', label: 'Master Instrumen RELI (BAR 64 Butir)', url: '/admin/settings?tab=reli' },
      { type: 'Menu', label: 'Master Katalog Sanksi', url: '/admin/settings?tab=sanksi' }
    ].filter(menu => menu.label.toLowerCase().includes(q.toLowerCase()));

    // Search Users
    const foundUsers = await db.select({
      id: users.id,
      name: users.name,
      role: users.role,
      wilayah: users.wilayah,
      fase: users.fase
    }).from(users).where(or(
      like(users.name, searchPattern),
      like(users.id, searchPattern)
    )).limit(5);

    // Search Agendas
    const foundAgendas = await db.select({
      id: agendas.id,
      name: agendas.name,
      theme: agendas.theme,
      type: agendas.type
    }).from(agendas).where(or(
      like(agendas.name, searchPattern),
      like(agendas.theme, searchPattern)
    )).limit(5);

    // Combine results
    const results = [];
    staticMenus.forEach(m => results.push({ type: 'Menu', title: m.label, subtitle: 'Pintas Menu', url: m.url }));
    
    foundUsers.forEach(u => {
      const isEtoser = u.role === 'Etoser' || u.role === 'PM';
      const isFasil = u.role === 'Fasilitator' || u.role === 'Fasil';
      const targetUrl = isEtoser ? `/admin/etoser/${u.id}` : isFasil ? `/admin/fasil/${u.id}` : `/admin/users?search=${encodeURIComponent(u.name)}`;
      const sub = isEtoser ? `Etoser (${u.fase || 'T0'}) • ${u.wilayah || 'Pusat'}` : `${u.role} • ${u.wilayah || 'Pusat'}`;
      results.push({ type: 'User', title: `${u.name} (${u.id})`, subtitle: sub, url: targetUrl });
    });
    
    foundAgendas.forEach(a => results.push({ type: 'Agenda', title: a.name, subtitle: `${a.type} • ${a.theme || 'Tanpa Tema'}`, url: '/admin/agendas' }));

    return NextResponse.json({ results });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
