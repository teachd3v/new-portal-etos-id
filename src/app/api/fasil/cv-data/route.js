import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, profil_user, portofolio } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyJwt } from '@/lib/auth';

export async function GET(req) {
  try {
    const tokenCookie = req.cookies.get('auth_token');
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(tokenCookie.value);
    if (!payload || !payload.role.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = payload.id;
    const userResult = await db.select().from(users).where(eq(users.id, userId));
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const profilResult = await db.select().from(profil_user).where(eq(profil_user.id, userId));
    const profil = profilResult[0] || {};

    const portoRows = await db
      .select()
      .from(portofolio)
      .where(eq(portofolio.user_id, userId))
      .orderBy(desc(portofolio.tahun));

    // Get Binaan Etoser
    const allUsers = await db.select().from(users);
    let binaanIds = [];
    if (user.relasi_etoser && user.relasi_etoser.trim() !== '') {
      binaanIds = user.relasi_etoser.split(',').map((idStr) => idStr.trim()).filter(Boolean);
    } else {
      binaanIds = allUsers
        .filter((u) => (u.role === 'Etoser' || u.role === 'PM') && u.wilayah === user.wilayah)
        .map((u) => u.id);
    }

    const allProfiles = await db.select().from(profil_user);
    const profileMap = new Map();
    allProfiles.forEach((p) => profileMap.set(p.id, p));

    const binaanList = allUsers
      .filter((u) => binaanIds.includes(u.id))
      .map((b) => {
        const bp = profileMap.get(b.id) || {};
        return {
          id: b.id,
          name: b.name,
          angkatan: b.angkatan || '-',
          wilayah: b.wilayah || '-',
          universitas: bp.universitas || '-',
        };
      });

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        role: user.role,
        fasil_role: user.fasil_role || 'Reguler',
        wilayah: user.wilayah || '-',
        profesi: profil.profesi || '',
        instansi: profil.instansi || '',
        sektor_industri: profil.sektor_industri || '',
        pengalaman_tahun: profil.pengalaman_tahun || '',
        bidang_keahlian: profil.bidang_keahlian || '',
        bio_profesional: profil.bio_profesional || '',
        pendidikan_terakhir: profil.pendidikan_terakhir || '',
        universitas: profil.universitas || '',
        jurusan: profil.jurusan || '',
        no_hp: profil.no_hp || '',
        email_profesional: profil.email_profesional || '',
        linkedin_url: profil.linkedin_url || '',
        alamat_domisili: profil.alamat_domisili || '',
        foto_profil: profil.foto_profil || user.avatar_url || '',
      },
      portofolios: portoRows,
      binaan: binaanList,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
