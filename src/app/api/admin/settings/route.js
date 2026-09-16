import { NextResponse } from 'next/server';
import { db } from '@/db';
import { app_settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const data = await db.select().from(app_settings);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json(); // Expected: array of {key, value}
    
    // SQLite D1 bulk upsert workaround: insert one by one or delete then insert
    // For simplicity, we loop and upsert based on key (we'll delete existing keys then insert new)
    for (const item of body) {
      const existing = await db.select().from(app_settings).where(eq(app_settings.key, item.key));
      if (existing.length > 0) {
        await db.update(app_settings).set({ value: item.value, updated_at: new Date().toISOString() }).where(eq(app_settings.key, item.key));
      } else {
        await db.insert(app_settings).values({ id: 'SET-' + Date.now() + Math.random(), key: item.key, value: item.value, updated_at: new Date().toISOString() });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
