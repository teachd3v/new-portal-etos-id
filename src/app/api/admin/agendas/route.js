import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agendas, post_test_questions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const allAgendas = await db.select().from(agendas);
    return NextResponse.json(allAgendas);
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
      }).returning();

      if (body.questions && Array.isArray(body.questions)) {
        for (const q of body.questions) {
          const qId = `Q-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await tx.insert(post_test_questions).values({
            id: qId,
            agenda_id: agendaId,
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
