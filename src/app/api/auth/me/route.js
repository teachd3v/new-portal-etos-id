import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import { db } from '@/db';
import { users, profil_user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const tokenCookie = req.cookies.get('auth_token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJwt(tokenCookie.value);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let avatar_url = null;
    let dbName = payload.name;
    let wilayah = null;
    let angkatan = null;
    let fase = null;

    try {
      const userRes = await db.select().from(users).where(eq(users.id, payload.id));
      if (userRes.length > 0) {
        avatar_url = userRes[0].avatar_url;
        dbName = userRes[0].name || payload.name;
        wilayah = userRes[0].wilayah || null;
        angkatan = userRes[0].angkatan || null;
        fase = userRes[0].fase || 'T0';
      }
      if (!avatar_url) {
        const profRes = await db.select().from(profil_user).where(eq(profil_user.id, payload.id));
        if (profRes.length > 0) {
          avatar_url = profRes[0].foto_profil;
        }
      }
    } catch (e) {
      console.error('Failed to get user metadata:', e);
    }

    return NextResponse.json({
      id: payload.id,
      name: dbName,
      role: payload.role,
      wilayah,
      angkatan,
      fase,
      avatar_url,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
