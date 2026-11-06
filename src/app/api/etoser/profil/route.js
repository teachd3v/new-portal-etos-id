import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, profil_user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;

    // Get user base info
    const userResult = await db.select().from(users).where(eq(users.id, userId));
    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Get extra profile info
    const profilResult = await db.select().from(profil_user).where(eq(profil_user.id, userId));
    const profil = profilResult[0] || {};

    const fotoProfil = profil.foto_profil || user.avatar_url || '';

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        angkatan: user.angkatan,
        wilayah: user.wilayah,
        tahun_pembinaan: user.tahun_pembinaan,
        fase: user.fase || 'T0',
        universitas: profil.universitas || '',
        fakultas: profil.fakultas || '',
        jurusan: profil.jurusan || '',
        semester_berjalan: profil.semester_berjalan || '',
        ipk_terakhir: profil.ipk_terakhir ?? null,
        no_hp: profil.no_hp || '',
        alamat_domisili: profil.alamat_domisili || '',
        foto_profil: fotoProfil,
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
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;

    const body = await req.json();
    const {
      universitas,
      fakultas,
      jurusan,
      semester_berjalan,
      ipk_terakhir,
      no_hp,
      alamat_domisili,
      foto_profil,
    } = body;

    if (
      !universitas?.trim() ||
      !fakultas?.trim() ||
      !jurusan?.trim() ||
      !String(semester_berjalan || '').trim() ||
      ipk_terakhir === null ||
      ipk_terakhir === undefined ||
      String(ipk_terakhir).trim() === '' ||
      !no_hp?.trim() ||
      !alamat_domisili?.trim()
    ) {
      return NextResponse.json(
        { error: 'Seluruh data akademik dan kontak wajib diisi lengkap.' },
        { status: 400 }
      );
    }

    const existing = await db.select().from(profil_user).where(eq(profil_user.id, userId));

    const updateData = {
      universitas: universitas.trim(),
      fakultas: fakultas.trim(),
      jurusan: jurusan.trim(),
      semester_berjalan: String(semester_berjalan).trim(),
      ipk_terakhir: parseFloat(ipk_terakhir),
      no_hp: no_hp.trim(),
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

    return NextResponse.json({ success: true, message: 'Profil berhasil diperbarui' }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
