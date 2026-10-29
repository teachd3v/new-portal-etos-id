import { NextResponse } from 'next/server';
import { db } from '@/db';
import { post_test_questions, post_test_attempts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    const { id } = await params; // agendaId
    const url = new URL(req.url);
    const requestedType = (url.searchParams.get('type') || 'POST_TEST').toUpperCase();
    
    // Get questions for this agenda
    const allQuestions = await db.select({
      id: post_test_questions.id,
      agenda_id: post_test_questions.agenda_id,
      test_type: post_test_questions.test_type,
      question: post_test_questions.question,
      options: post_test_questions.options,
    }).from(post_test_questions).where(eq(post_test_questions.agenda_id, id));

    const filtered = allQuestions.filter(q => {
      const qType = (q.test_type || 'POST_TEST').toUpperCase();
      return qType === requestedType;
    });

    const sanitizedQuestions = filtered.map(q => ({
      ...q,
      options: JSON.parse(q.options) // parse options JSON
    }));

    return NextResponse.json({ success: true, testType: requestedType, questions: sanitizedQuestions });
  } catch (error) {
    console.error("Failed to fetch test questions", error);
    return NextResponse.json({ error: "Failed to fetch test questions" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params; // agendaId
    const body = await req.json();
    const { userId, answers, testType: rawTestType } = body; // answers is {"Q-1": "0", "Q-2": "3"}
    const testType = (rawTestType || 'POST_TEST').toUpperCase() === 'PRE_TEST' ? 'PRE_TEST' : 'POST_TEST';

    if (!userId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get original questions with correct options for this agenda & test_type
    const allDbQuestions = await db.select().from(post_test_questions).where(eq(post_test_questions.agenda_id, id));
    const dbQuestions = allDbQuestions.filter(q => {
      const qType = (q.test_type || 'POST_TEST').toUpperCase();
      return qType === testType;
    });
    
    if (dbQuestions.length === 0) {
      return NextResponse.json({ error: `No ${testType === 'PRE_TEST' ? 'pre-test' : 'post-test'} found for this agenda` }, { status: 404 });
    }

    let correctCount = 0;
    dbQuestions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer !== undefined && String(userAnswer) === String(q.correct_option)) {
        correctCount++;
      }
    });

    const score = (correctCount / dbQuestions.length) * 100;

    // Check if attempt already exists for this agenda + user + testType
    const userAgendaAttempts = await db.select().from(post_test_attempts).where(
      and(
        eq(post_test_attempts.agenda_id, id),
        eq(post_test_attempts.user_id, userId)
      )
    );
    const existing = userAgendaAttempts.filter(a => ((a.test_type || 'POST_TEST').toUpperCase() === testType));

    const prefix = testType === 'PRE_TEST' ? 'PREA' : 'PTA';
    const attemptId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    if (existing.length > 0) {
      // Update existing attempt by its primary key id
      await db.update(post_test_attempts).set({
        score: score,
        test_type: testType,
        answers: JSON.stringify(answers),
        timestamp: new Date()
      }).where(eq(post_test_attempts.id, existing[0].id));
    } else {
      // Insert new attempt
      await db.insert(post_test_attempts).values({
        id: attemptId,
        agenda_id: id,
        user_id: userId,
        test_type: testType,
        score: score,
        answers: JSON.stringify(answers),
        timestamp: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      testType,
      score: Math.round(score),
      correctCount,
      totalCount: dbQuestions.length
    });
  } catch (error) {
    console.error("Failed to submit test attempt", error);
    return NextResponse.json({ error: "Failed to submit test attempt" }, { status: 500 });
  }
}
