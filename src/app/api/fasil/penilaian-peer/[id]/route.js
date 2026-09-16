import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, reli_instrumen, periode_penilaian, reli_assessments, reli_consolidated, katalog_sanksi, sanksi_user } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { calculateAssessmentScores, consolidateReliScores, convertToFasilPOV } from '@/lib/reli';
import crypto from 'crypto';


export async function GET(req, { params }) {
  try {
    const { id: etoserId } = await params;
    
    const user = await getAuthUser(req);
    if (!user || (!user.role?.toUpperCase().includes('FASIL') && user.role?.toUpperCase() !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Etoser Check
    const etoserRecords = await db.select().from(users).where(eq(users.id, etoserId));
    if (!etoserRecords.length) return NextResponse.json({ error: 'Etoser tidak ditemukan' }, { status: 404 });
    const etoser = etoserRecords[0];

    // 2. Active RELI Period Check
    const openPeriods = await db.select().from(periode_penilaian).where(
      and(
        eq(periode_penilaian.is_open, true),
        eq(periode_penilaian.tipe_instrumen, 'RELI')
      )
    );
    const activePeriod = openPeriods[0] || null;

    if (!activePeriod) {
      return NextResponse.json({ error: 'Tidak ada periode asesmen RELI yang aktif saat ini.' }, { status: 400 });
    }

    const periodeKode = activePeriod.kode_periode || 'T0';

    // 3. Check if already assessed by Facilitator
    const existingFacilAssessments = await db.select().from(reli_assessments).where(
      and(
        eq(reli_assessments.user_id, etoserId),
        eq(reli_assessments.evaluator_type, 'FACILITATOR'),
        eq(reli_assessments.periode_kode, periodeKode)
      )
    );
    const isAssessed = existingFacilAssessments.length > 0;
    const existingSubmission = isAssessed ? existingFacilAssessments[0] : null;

    // Check self assessment
    const existingSelfAssessments = await db.select().from(reli_assessments).where(
      and(
        eq(reli_assessments.user_id, etoserId),
        eq(reli_assessments.evaluator_type, 'SELF'),
        eq(reli_assessments.periode_kode, periodeKode)
      )
    );
    const hasSelfAssessed = existingSelfAssessments.length > 0;

    // 4. Fetch 64 RELI Questions converted to Fasil POV
    const questions = await db.select().from(reli_instrumen).orderBy(asc(reli_instrumen.order_num));
    const fasilQuestions = questions.map(q => ({
      ...q,
      bar_level_1: convertToFasilPOV(q.bar_level_1),
      bar_level_2: convertToFasilPOV(q.bar_level_2),
      bar_level_3: convertToFasilPOV(q.bar_level_3),
      bar_level_4: convertToFasilPOV(q.bar_level_4),
    }));
    
    // 5. Fetch Katalog Sanksi
    const katalogSanksi = await db.select().from(katalog_sanksi);

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

    return NextResponse.json({
      success: true,
      etoser: { id: etoser.id, name: etoser.name, angkatan: etoser.angkatan, wilayah: etoser.wilayah },
      activePeriod,
      isAssessed,
      hasSelfAssessed,
      existingAnswers,
      existingScore: existingSubmission ? existingSubmission.overall_score : null,
      questions: fasilQuestions,
      katalogSanksi
    });


  } catch (error) {
    console.error("Fasil RELI Assessment GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id: etoserId } = await params;
    const user = await getAuthUser(req);
    if (!user || (!user.role?.toUpperCase().includes('FASIL') && user.role?.toUpperCase() !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { answers, periode_kode, periode_id, tahun, sanksi } = body;

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'Data penilaian belum lengkap' }, { status: 400 });
    }

    const kodePeriode = periode_kode || 'T0';
    const tahunStr = tahun ? String(tahun) : new Date().getFullYear().toString();

    // 1. Calculate Facilitator assessment scores
    const calculated = calculateAssessmentScores(answers);

    const assessmentId = `${etoserId}_FACIL_${kodePeriode}`;

    const assessmentValues = {
      id: assessmentId,
      user_id: etoserId,
      evaluator_id: user.id,
      evaluator_type: 'FACILITATOR',
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

    const existing = await db.select().from(reli_assessments).where(eq(reli_assessments.id, assessmentId));
    if (existing.length > 0) {
      await db.update(reli_assessments).set(assessmentValues).where(eq(reli_assessments.id, assessmentId));
    } else {
      await db.insert(reli_assessments).values(assessmentValues);
    }

    // 2. Fetch Self Assessment for this Etoser
    const selfAssessmentResult = await db.select().from(reli_assessments).where(
      and(
        eq(reli_assessments.user_id, etoserId),
        eq(reli_assessments.evaluator_type, 'SELF'),
        eq(reli_assessments.periode_kode, kodePeriode)
      )
    );
    const selfAssessment = selfAssessmentResult[0] || null;

    // 3. Fetch Baseline Consolidated (T0)
    let baselineConsolidated = null;
    if (kodePeriode !== 'T0') {
      const baselineResult = await db.select().from(reli_consolidated).where(
        and(
          eq(reli_consolidated.user_id, etoserId),
          eq(reli_consolidated.periode_kode, 'T0')
        )
      );
      baselineConsolidated = baselineResult[0] || null;
    }

    // 4. Consolidate Scores
    const consolidated = consolidateReliScores(selfAssessment, assessmentValues, baselineConsolidated);

    const consolidatedId = `${etoserId}_${kodePeriode}`;
    const consolidatedValues = {
      id: consolidatedId,
      user_id: etoserId,
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

    // 5. Insert Sanksi if reported
    if (sanksi && sanksi.katalog_sanksi_id) {
      const sanksiId = `SNK-${crypto.randomBytes(4).toString('hex')}`;
      await db.insert(sanksi_user).values({
        id: sanksiId,
        user_id: etoserId,
        fasil_id: user.id,
        katalog_sanksi_id: sanksi.katalog_sanksi_id,
        poin: sanksi.poin || 0,
        keterangan: sanksi.keterangan || null,
        status: 'PENDING',
        period_month: kodePeriode,
        period_year: tahunStr,
        timestamp: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Penilaian fasilitator berhasil disimpan.',
      facil_score: calculated.overall,
      final_reli: consolidated.final_reli,
      gap_score: consolidated.gap_score,
      gap_category: consolidated.gap_category,
      maturity_level: consolidated.maturity_level
    });
  } catch (error) {
    console.error("Fasil RELI Assessment POST Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

