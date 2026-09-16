import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, profil_user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJwt } from '@/lib/auth';

export async function GET(req) {
  try {
    const tokenCookie = req.cookies.get('auth_token');
    let userId = 'E2023019'; // Fallback for dev

    if (tokenCookie && tokenCookie.value) {
      const payload = await verifyJwt(tokenCookie.value);
      if (payload) {
        userId = payload.id;
      }
    }

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

    return NextResponse.json({
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
      ipk_terakhir: profil.ipk_terakhir || null,
      no_hp: profil.no_hp || '',
      alamat_domisili: profil.alamat_domisili || '',
      foto_profil: fotoProfil
    }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const tokenCookie = req.cookies.get('auth_token');
    let userId = 'E2023019'; 

    if (tokenCookie && tokenCookie.value) {
      const payload = await verifyJwt(tokenCookie.value);
      if (payload) {
        userId = payload.id;
      }
    }

    const body = await req.json();
    const { universitas, fakultas, jurusan, semester_berjalan, ipk_terakhir, no_hp, alamat_domisili, foto_profil } = body;

    // Check if profile exists
    const existing = await db.select().from(profil_user).where(eq(profil_user.id, userId));
    
    const updateData = {
      universitas,
      fakultas,
      jurusan,
      semester_berjalan,
      ipk_terakhir: ipk_terakhir ? parseFloat(ipk_terakhir) : null,
      no_hp,
      alamat_domisili
    };

    if (foto_profil !== undefined) {
      updateData.foto_profil = foto_profil;
      // Also sync avatar_url on users table
      await db.update(users).set({ avatar_url: foto_profil }).where(eq(users.id, userId));
    }

    if (existing.length > 0) {
      await db.update(profil_user)
        .set(updateData)
        .where(eq(profil_user.id, userId));
    } else {
      await db.insert(profil_user).values({
        id: userId,
        ...updateData
      });
    }

    return NextResponse.json({ success: true, message: 'Profil berhasil diperbarui' }, { status: 200 });


  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
