import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { katalog_sanksi } from '@/db/schema';

export async function GET(req) {
  try {
    const data = await db.select().from(katalog_sanksi);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    if (Array.isArray(body)) {
      const dataToInsert = body.map(item => ({ 
        id: 'KATALOG_SANKSI-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2,6), 
        ...item 
      }));
      // SQLite batch insert
      const newData = await db.insert(katalog_sanksi).values(dataToInsert).returning();
      return NextResponse.json(newData);
    } else {
      const id = 'KATALOG_SANKSI-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2,6);
      const newData = await db.insert(katalog_sanksi).values({ id, ...body }).returning();
      return NextResponse.json(newData[0]);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create data" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }
    await db.delete(katalog_sanksi).where(inArray(katalog_sanksi.id, ids));
    return NextResponse.json({ message: "Bulk delete successful" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
