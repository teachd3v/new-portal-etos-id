import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { signJwt, verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(req) {
  try {
    const { id, password } = await req.json();

    if (!id || !password) {
      return NextResponse.json({ error: 'ID dan Password wajib diisi' }, { status: 400 });
    }

    const result = await db.select().from(users).where(eq(users.id, id));
    const user = result[0];

    if (!user || !user.password) {
      return NextResponse.json({ error: 'ID atau Password salah' }, { status: 401 });
    }

    const { valid, needsUpgrade } = await verifyPassword(password, user.password);

    if (!valid) {
      return NextResponse.json({ error: 'ID atau Password salah' }, { status: 401 });
    }

    // Auto-upgrade legacy plaintext password to secure hash in the background
    if (needsUpgrade) {
      try {
        const newHash = await hashPassword(password);
        await db.update(users).set({ password: newHash }).where(eq(users.id, user.id));
      } catch (err) {
        console.error('Failed to auto-upgrade password hash:', err);
      }
    }

    // Create JWT
    const token = await signJwt({ id: user.id, name: user.name, role: user.role });

    const response = NextResponse.json({ success: true, role: user.role });
    
    // Set cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

