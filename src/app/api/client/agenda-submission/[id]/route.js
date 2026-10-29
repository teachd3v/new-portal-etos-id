import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agenda_submissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const { id: agendaId } = await params;
    const { searchParams } = new URL(req.url);
    const authUser = await getAuthUser(req);
    const userId = searchParams.get('userId') || authUser?.id;

    if (!userId) {
      const all = await db.select().from(agenda_submissions).where(eq(agenda_submissions.agenda_id, agendaId));
      return NextResponse.json({ success: true, data: all });
    }

    const existing = await db.select().from(agenda_submissions).where(
      and(
        eq(agenda_submissions.agenda_id, agendaId),
        eq(agenda_submissions.user_id, userId)
      )
    );

    return NextResponse.json({
      success: true,
      submission: existing[0] || null
    });
  } catch (error) {
    console.error('Failed to fetch agenda submission:', error);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id: agendaId } = await params;
    const body = await req.json();
    const authUser = await getAuthUser(req);
    const userId = body.userId || authUser?.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { file_name, file_url, link_url, notes } = body;
    if (!file_url && !link_url && (!notes || !notes.trim())) {
      return NextResponse.json({ error: 'Kumpulkan penugasan melalui file, tautan link, atau catatan jawaban' }, { status: 400 });
    }

    const existing = await db.select().from(agenda_submissions).where(
      and(
        eq(agenda_submissions.agenda_id, agendaId),
        eq(agenda_submissions.user_id, userId)
      )
    );

    const nowIso = new Date().toISOString();

    if (existing.length > 0) {
      await db.update(agenda_submissions).set({
        file_name: file_name !== undefined ? file_name : existing[0].file_name,
        file_url: file_url !== undefined ? file_url : existing[0].file_url,
        link_url: link_url !== undefined ? link_url : existing[0].link_url,
        notes: notes !== undefined ? notes : existing[0].notes,
        submitted_at: nowIso,
      }).where(eq(agenda_submissions.id, existing[0].id));

      return NextResponse.json({
        success: true,
        message: 'Penugasan berhasil diperbarui',
        submission: {
          ...existing[0],
          file_name: file_name !== undefined ? file_name : existing[0].file_name,
          file_url: file_url !== undefined ? file_url : existing[0].file_url,
          link_url: link_url !== undefined ? link_url : existing[0].link_url,
          notes: notes !== undefined ? notes : existing[0].notes,
          submitted_at: nowIso,
        }
      });
    } else {
      const subId = `SUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newSub = {
        id: subId,
        agenda_id: agendaId,
        user_id: userId,
        file_name: file_name || null,
        file_url: file_url || null,
        link_url: link_url || null,
        notes: notes || null,
        submitted_at: nowIso,
      };
      await db.insert(agenda_submissions).values(newSub);

      return NextResponse.json({
        success: true,
        message: 'Penugasan berhasil dikumpulkan',
        submission: newSub
      });
    }
  } catch (error) {
    console.error('Failed to save agenda submission:', error);
    return NextResponse.json({ error: 'Gagal menyimpan penugasan' }, { status: 500 });
  }
}
