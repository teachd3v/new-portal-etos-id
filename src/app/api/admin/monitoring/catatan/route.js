import { NextResponse } from 'next/server';
import { db } from '@/db';
import { catatan_admin } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req) {
  try {
    const body = await req.json();
    const { target_user_id, period_month, period_year, catatan } = body;

    if (!target_user_id || !period_month || !period_year) {
      return NextResponse.json({ error: 'Data target_user_id, period_month, dan period_year wajib diisi' }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select().from(catatan_admin).where(
      and(
        eq(catatan_admin.target_user_id, target_user_id),
        eq(catatan_admin.period_month, period_month),
        eq(catatan_admin.period_year, period_year)
      )
    );

    if (existing.length > 0) {
      // Update
      await db.update(catatan_admin)
        .set({
          catatan: catatan || '',
          timestamp: new Date()
        })
        .where(eq(catatan_admin.id, existing[0].id));
    } else {
      // Insert
      const newId = 'note_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      await db.insert(catatan_admin).values({
        id: newId,
        target_user_id,
        period_month,
        period_year,
        catatan: catatan || '',
        timestamp: new Date()
      });
    }

    return NextResponse.json({ success: true, message: 'Catatan admin berhasil disimpan' });

  } catch (error) {
    console.error('Save Admin Note Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
