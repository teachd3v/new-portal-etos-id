import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agendas, post_test_questions, post_test_attempts, attendance } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const agendaList = await db.select().from(agendas).where(eq(agendas.id, id));
    if (agendaList.length === 0) {
      return NextResponse.json({ error: "Agenda not found" }, { status: 404 });
    }
    const questionsList = await db.select().from(post_test_questions).where(eq(post_test_questions.agenda_id, id));
    return NextResponse.json({
      agenda: agendaList[0],
      questions: questionsList.map(q => ({
        ...q,
        options: JSON.parse(q.options)
      }))
    });
  } catch (error) {
    console.error("Failed to fetch agenda details", error);
    return NextResponse.json({ error: "Failed to fetch agenda details" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const result = await db.transaction(async (tx) => {
      const updatedAgenda = await tx.update(agendas).set({
        name: body.name,
        type: body.type,
        activity_type: body.activity_type || null,
        theme: body.theme || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        is_active: body.is_active,
        target_role: body.target_role || 'ETOSER',
      }).where(eq(agendas.id, id)).returning();
      
      if (updatedAgenda.length === 0) {
        throw new Error("Agenda not found");
      }

      // Delete existing questions and insert new ones
      await tx.delete(post_test_questions).where(eq(post_test_questions.agenda_id, id));

      if (body.questions && Array.isArray(body.questions)) {
        for (const q of body.questions) {
          const qId = `Q-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await tx.insert(post_test_questions).values({
            id: qId,
            agenda_id: id,
            question: q.question,
            options: JSON.stringify(q.options),
            correct_option: String(q.correct_option),
          });
        }
      }

      return updatedAgenda[0];
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update agenda", error);
    if (error.message === "Agenda not found") {
      return NextResponse.json({ error: "Agenda not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update agenda" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    
    const result = await db.transaction(async (tx) => {
      // 1. Delete associated post test questions
      await tx.delete(post_test_questions).where(eq(post_test_questions.agenda_id, id));
      
      // 2. Delete associated post test attempts
      await tx.delete(post_test_attempts).where(eq(post_test_attempts.agenda_id, id));
      
      // 3. Delete associated attendance records
      await tx.delete(attendance).where(eq(attendance.agenda_id, id));
      
      // 4. Delete agenda
      const deletedAgenda = await tx.delete(agendas).where(eq(agendas.id, id)).returning();
      return deletedAgenda;
    });
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Agenda not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: result[0] });
  } catch (error) {
    console.error("Failed to delete agenda", error);
    return NextResponse.json({ error: "Failed to delete agenda: " + error.message }, { status: 500 });
  }
}
