import { NextResponse } from 'next/server';
import { db } from '@/db';
import { post_test_questions, post_test_attempts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const { id } = await params; // agendaId
    
    // Get questions for this agenda
    const questions = await db.select({
      id: post_test_questions.id,
      agenda_id: post_test_questions.agenda_id,
      question: post_test_questions.question,
      options: post_test_questions.options,
    }).from(post_test_questions).where(eq(post_test_questions.agenda_id, id));

    const sanitizedQuestions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options) // parse options JSON
    }));

    return NextResponse.json({ success: true, questions: sanitizedQuestions });
  } catch (error) {
    console.error("Failed to fetch post test questions", error);
    return NextResponse.json({ error: "Failed to fetch post test questions" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params; // agendaId
    const body = await req.json();
    const { userId, answers } = body; // answers is {"Q-1": "0", "Q-2": "3"}

    if (!userId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get original questions with correct options
    const dbQuestions = await db.select().from(post_test_questions).where(eq(post_test_questions.agenda_id, id));
    
    if (dbQuestions.length === 0) {
      return NextResponse.json({ error: "No post test found for this agenda" }, { status: 404 });
    }

    let correctCount = 0;
    dbQuestions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer !== undefined && String(userAnswer) === String(q.correct_option)) {
        correctCount++;
      }
    });

    const score = (correctCount / dbQuestions.length) * 100;

    // Check if attempt already exists
    const existing = await db.select().from(post_test_attempts).where(
      and(
        eq(post_test_attempts.agenda_id, id),
        eq(post_test_attempts.user_id, userId)
      )
    );

    const attemptId = `PTA-${Date.now()}`;

    if (existing.length > 0) {
      // Update existing attempt
      await db.update(post_test_attempts).set({
        score: score,
        answers: JSON.stringify(answers),
        timestamp: new Date()
      }).where(
        and(
          eq(post_test_attempts.agenda_id, id),
          eq(post_test_attempts.user_id, userId)
        )
      );
    } else {
      // Insert new attempt
      await db.insert(post_test_attempts).values({
        id: attemptId,
        agenda_id: id,
        user_id: userId,
        score: score,
        answers: JSON.stringify(answers),
        timestamp: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      score: Math.round(score),
      correctCount,
      totalCount: dbQuestions.length
    });
  } catch (error) {
    console.error("Failed to submit post test attempt", error);
    return NextResponse.json({ error: "Failed to submit post test attempt" }, { status: 500 });
  }
}
