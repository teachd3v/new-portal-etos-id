import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, profil_user } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
    const fotoProfil = profil.foto_profil || user.avatar_url || '';

    return NextResponse.json(
      {
        success: true,
        data: {
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
          foto_profil: fotoProfil,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
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
    const body = await req.json();
    const {
      profesi,
      instansi,
      sektor_industri,
      pengalaman_tahun,
      bidang_keahlian,
      bio_profesional,
      pendidikan_terakhir,
      universitas,
      jurusan,
      no_hp,
      email_profesional,
      linkedin_url,
      alamat_domisili,
      foto_profil,
    } = body;

    if (
      !profesi?.trim() ||
      !instansi?.trim() ||
      !sektor_industri?.trim() ||
      !pengalaman_tahun?.trim() ||
      !pendidikan_terakhir?.trim() ||
      !universitas?.trim() ||
      !jurusan?.trim() ||
      !no_hp?.trim() ||
      !email_profesional?.trim() ||
      !alamat_domisili?.trim()
    ) {
      return NextResponse.json(
        { error: 'Mohon lengkapi seluruh kolom profil profesional yang bertanda bintang (*).' },
        { status: 400 }
      );
    }

    const existing = await db.select().from(profil_user).where(eq(profil_user.id, userId));

    const updateData = {
      profesi: profesi.trim(),
      instansi: instansi.trim(),
      sektor_industri: sektor_industri.trim(),
      pengalaman_tahun: pengalaman_tahun.trim(),
      bidang_keahlian: (bidang_keahlian || '').trim(),
      bio_profesional: (bio_profesional || '').trim(),
      pendidikan_terakhir: pendidikan_terakhir.trim(),
      universitas: universitas.trim(),
      jurusan: jurusan.trim(),
      no_hp: no_hp.trim(),
      email_profesional: email_profesional.trim(),
      linkedin_url: (linkedin_url || '').trim(),
      alamat_domisili: alamat_domisili.trim(),
    };

    if (foto_profil !== undefined) {
      updateData.foto_profil = foto_profil;
      await db.update(users).set({ avatar_url: foto_profil }).where(eq(users.id, userId));
    }

    if (existing.length > 0) {
      await db.update(profil_user).set(updateData).where(eq(profil_user.id, userId));
    } else {
      await db.insert(profil_user).values({
        id: userId,
        ...updateData,
      });
    }

    return NextResponse.json({ success: true, message: 'Profil profesional berhasil disimpan' }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
