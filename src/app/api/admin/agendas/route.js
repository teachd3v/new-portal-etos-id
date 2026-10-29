import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agendas, post_test_questions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const allAgendas = await db.select().from(agendas);
    const allQuestions = await db.select({
      agenda_id: post_test_questions.agenda_id,
      test_type: post_test_questions.test_type,
    }).from(post_test_questions);

    const enriched = allAgendas.map(agenda => {
      const agendaQs = allQuestions.filter(q => q.agenda_id === agenda.id);
      const preTestCount = agendaQs.filter(q => q.test_type === 'PRE_TEST').length;
      const postTestCount = agendaQs.filter(q => !q.test_type || q.test_type === 'POST_TEST').length;
      return {
        ...agenda,
        preTestCount,
        postTestCount,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch agendas", error);
    return NextResponse.json({ error: "Failed to fetch agendas" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Auto-generate ID if not provided: AG-TIMESTAMP-RANDOM
    const generateId = () => {
      const ts = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `AG-${ts}-${rand}`;
    };

    const agendaId = body.id || generateId();

    const savedAgenda = await db.transaction(async (tx) => {
      const newAgenda = await tx.insert(agendas).values({
        id: agendaId,
        name: body.name,
        type: body.type, // 'Nasional' or 'Wilayah'
        activity_type: body.activity_type || null,
        theme: body.theme || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        target_role: body.target_role || 'ETOSER',
        assignment_title: body.assignment_title || null,
        assignment_file_name: body.assignment_file_name || null,
        assignment_file_url: body.assignment_file_url || null,
        assignment_link: body.assignment_link || null,
      }).returning();

      // Insert Pre-Test Questions
      if (body.preTestQuestions && Array.isArray(body.preTestQuestions)) {
        for (const q of body.preTestQuestions) {
          const qId = `PREQ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await tx.insert(post_test_questions).values({
            id: qId,
            agenda_id: agendaId,
            test_type: 'PRE_TEST',
            question: q.question,
            options: JSON.stringify(q.options),
            correct_option: String(q.correct_option),
          });
        }
      }

      // Insert Post-Test Questions
      if (body.questions && Array.isArray(body.questions)) {
        for (const q of body.questions) {
          const qId = `Q-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await tx.insert(post_test_questions).values({
            id: qId,
            agenda_id: agendaId,
            test_type: 'POST_TEST',
            question: q.question,
            options: JSON.stringify(q.options),
            correct_option: String(q.correct_option),
          });
        }
      }
      return newAgenda[0];
    });

    return NextResponse.json(savedAgenda);
  } catch (error) {
    console.error("Failed to create agenda", error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: "Agenda ID already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create agenda" }, { status: 500 });
  }
}
