import { NextResponse } from 'next/server';
import { db } from '@/db';
import { katalog_sanksi } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await db.update(katalog_sanksi).set(body).where(eq(katalog_sanksi.id, id)).returning();
    if (updated.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const deleted = await db.delete(katalog_sanksi).where(eq(katalog_sanksi.id, id)).returning();
    if (deleted.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
}
