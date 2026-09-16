import { NextResponse } from 'next/server';
import { db } from '@/db';
import { periode_penilaian, reli_instrumen, users, reli_assessments, reli_consolidated } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { calculateAssessmentScores, consolidateReliScores } from '@/lib/reli';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get active RELI period
    const openPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        eq(periode_penilaian.tipe_instrumen, 'RELI')
      )
    );

    const activePeriod = openPeriods[0];

    if (!activePeriod) {
      return NextResponse.json({ 
        isOpen: false, 
        message: 'Tidak ada periode asesmen RELI yang sedang aktif saat ini.' 
      }, { status: 200 });
    }

    const periodeKode = activePeriod.kode_periode || 'T0';

    // 2. Check if user already submitted for this active period
    const existingAssessments = await db.select().from(reli_assessments).where(
      and(
        eq(reli_assessments.user_id, user.id),
        eq(reli_assessments.evaluator_type, 'SELF'),
        eq(reli_assessments.periode_kode, periodeKode)
      )
    );

    const isSubmitted = existingAssessments.length > 0;
    const existingSubmission = isSubmitted ? existingAssessments[0] : null;

    let existingAnswers = null;
    if (existingSubmission && existingSubmission.raw_answers) {
      try {
        existingAnswers = typeof existingSubmission.raw_answers === 'string'
          ? JSON.parse(existingSubmission.raw_answers)
          : existingSubmission.raw_answers;
      } catch (e) {
        existingAnswers = null;
      }
    }

    // 3. Fetch 64 items
    const questions = await db.select().from(reli_instrumen).orderBy(asc(reli_instrumen.order_num));

    return NextResponse.json({
      isOpen: true,
      period: activePeriod,
      isSubmitted,
      existingAnswers,
      existingScore: existingSubmission ? existingSubmission.overall_score : null,
      existingMaturityLevel: existingSubmission ? (
        existingSubmission.overall_score >= 3.25 ? 'Resilient Leader' :
        existingSubmission.overall_score >= 2.50 ? 'Transformative Leader' :
        existingSubmission.overall_score >= 1.75 ? 'Developing Leader' : 'Emerging Leader'
      ) : null,
      submittedAt: existingSubmission?.timestamp ? String(existingSubmission.timestamp) : null,
      questions
    }, { status: 200 });

  } catch (error) {
    console.error('RELI Self Assessment API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { periode_kode, periode_id, tahun, answers } = body;

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'Data jawaban belum lengkap' }, { status: 400 });
    }

    const kodePeriode = periode_kode || 'T0';
    const tahunStr = tahun ? String(tahun) : new Date().getFullYear().toString();

    // 1. Calculate scores
    const calculated = calculateAssessmentScores(answers);

    const assessmentId = `${user.id}_SELF_${kodePeriode}`;

    // 2. Save or update self assessment
    const existing = await db.select().from(reli_assessments).where(eq(reli_assessments.id, assessmentId));

    const assessmentValues = {
      id: assessmentId,
      user_id: user.id,
      evaluator_id: user.id,
      evaluator_type: 'SELF',
      periode_kode: kodePeriode,
      periode_id: periode_id || null,
      tahun: tahunStr,
      raw_answers: JSON.stringify(answers),
      vr_score: calculated.vr,
      sr_score: calculated.sr,
      sor_score: calculated.sor,
      cr_score: calculated.cr,
      subdimensions_json: JSON.stringify(calculated.subdimensions),
      overall_score: calculated.overall,
      timestamp: new Date()
    };

    if (existing.length > 0) {
      await db.update(reli_assessments).set(assessmentValues).where(eq(reli_assessments.id, assessmentId));
    } else {
      await db.insert(reli_assessments).values(assessmentValues);
    }

    // 3. Find Facilitator Assessment for this period if any
    const facilAssessmentResult = await db.select().from(reli_assessments).where(
      and(
        eq(reli_assessments.user_id, user.id),
        eq(reli_assessments.evaluator_type, 'FACILITATOR'),
        eq(reli_assessments.periode_kode, kodePeriode)
      )
    );
    const facilAssessment = facilAssessmentResult[0] || null;

    // 4. Find Baseline Consolidated (T0)
    let baselineConsolidated = null;
    if (kodePeriode !== 'T0') {
      const baselineResult = await db.select().from(reli_consolidated).where(
        and(
          eq(reli_consolidated.user_id, user.id),
          eq(reli_consolidated.periode_kode, 'T0')
        )
      );
      baselineConsolidated = baselineResult[0] || null;
    }

    // 5. Consolidate Scores
    const consolidated = consolidateReliScores(assessmentValues, facilAssessment, baselineConsolidated);

    const consolidatedId = `${user.id}_${kodePeriode}`;
    const consolidatedValues = {
      id: consolidatedId,
      user_id: user.id,
      periode_kode: kodePeriode,
      tahun: tahunStr,
      self_score: consolidated.self_score,
      facil_score: consolidated.facil_score,
      final_reli: consolidated.final_reli,
      gap_score: consolidated.gap_score,
      gap_category: consolidated.gap_category,
      maturity_level: consolidated.maturity_level,
      dimensions_json: JSON.stringify(consolidated.dimensions),
      subdimensions_json: JSON.stringify(consolidated.subdimensions),
      growth_delta: consolidated.growth_delta,
      growth_rate: consolidated.growth_rate,
      updated_at: new Date()
    };

    const existingConsolidated = await db.select().from(reli_consolidated).where(eq(reli_consolidated.id, consolidatedId));
    if (existingConsolidated.length > 0) {
      await db.update(reli_consolidated).set(consolidatedValues).where(eq(reli_consolidated.id, consolidatedId));
    } else {
      await db.insert(reli_consolidated).values(consolidatedValues);
    }

    return NextResponse.json({
      success: true,
      message: 'Penilaian mandiri RELI berhasil disimpan.',
      overall_score: calculated.overall,
      maturity_level: consolidated.maturity_level
    }, { status: 200 });
  } catch (error) {
    console.error('RELI Submit Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

