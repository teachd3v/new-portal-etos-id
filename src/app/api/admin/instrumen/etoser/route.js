import { inArray, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { instrumen_etoser } from '@/db/schema';

export async function GET(req) {
  try {
    const data = await db.select().from(instrumen_etoser);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const url = new URL(req.url);
    const checkOnly = url.searchParams.get('check_only') === 'true';
    const upsert = url.searchParams.get('upsert') === 'true';

    const body = await req.json();
    
    if (Array.isArray(body)) {
      if (checkOnly) {
         const existing = await db.select().from(instrumen_etoser);
         let existingCount = 0;
         body.forEach(item => {
           if (existing.find(e => e.kode === item.kode && String(e.tahun_pembinaan) === String(item.tahun_pembinaan))) {
             existingCount++;
           }
         });
         return NextResponse.json({ existingCount });
      }

      if (upsert) {
         const existingData = await db.select().from(instrumen_etoser);
         const toUpdate = [];
         const toInsert = [];
         
         body.forEach(item => {
           const existing = existingData.find(e => e.kode === item.kode && String(e.tahun_pembinaan) === String(item.tahun_pembinaan));
           if (existing) {
             toUpdate.push({ ...item, id: existing.id });
           } else {
             toInsert.push({ ...item, id: 'INSTRUMEN_ETOSER-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2,6) });
           }
         });
         
         // In SQLite we update one by one
         for (let item of toUpdate) {
            await db.update(instrumen_etoser).set(item).where(eq(instrumen_etoser.id, item.id));
         }
         
         if (toInsert.length > 0) {
            await db.insert(instrumen_etoser).values(toInsert);
         }
         return NextResponse.json({ success: true });
      }

      const dataToInsert = body.map(item => ({ 
        id: 'INSTRUMEN_ETOSER-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2,6), 
        ...item 
      }));
      const newData = await db.insert(instrumen_etoser).values(dataToInsert).returning();
      return NextResponse.json(newData);
    } else {
      const id = 'INSTRUMEN_ETOSER-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2,6);
      const newData = await db.insert(instrumen_etoser).values({ id, ...body }).returning();
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
    await db.delete(instrumen_etoser).where(inArray(instrumen_etoser.id, ids));
    return NextResponse.json({ message: "Bulk delete successful" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
