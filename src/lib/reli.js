/**
 * RELI (Resilient Leaders Index) Calculation Engine
 */

export const DIMENSIONS_MAP = {
  'Value Resilience': ['Spirituality', 'Integrity', 'Responsibility/Amanah', 'Civic & National Values'],
  'Self Resilience': ['Self-Awareness', 'Growth & Learning', 'Self-Management', 'Future Orientation'],
  'Social Resilience': ['Empathy', 'Collaboration', 'Contribution', 'Consistency'],
  'Change Resilience': ['Problem Solving', 'Execution', 'Adaptability', 'Leadership & Influence']
};

export const SUBDIMENSIONS_MAP = {
  'Spirituality': ['VR-S1', 'VR-S2', 'VR-S3', 'VR-S4'],
  'Integrity': ['VR-I1', 'VR-I2', 'VR-I3', 'VR-I4'],
  'Responsibility/Amanah': ['VR-A1', 'VR-A2', 'VR-A3', 'VR-A4'],
  'Civic & National Values': ['VR-C1', 'VR-C2', 'VR-C3', 'VR-C4'],
  'Self-Awareness': ['SR-A1', 'SR-A2', 'SR-A3', 'SR-A4'],
  'Growth & Learning': ['SR-G1', 'SR-G2', 'SR-G3', 'SR-G4'],
  'Self-Management': ['SR-M1', 'SR-M2', 'SR-M3', 'SR-M4'],
  'Future Orientation': ['SR-F1', 'SR-F2', 'SR-F3', 'SR-F4'],
  'Empathy': ['SoR-E1', 'SoR-E2', 'SoR-E3', 'SoR-E4'],
  'Collaboration': ['SoR-C1', 'SoR-C2', 'SoR-C3', 'SoR-C4'],
  'Contribution': ['SoR-K1', 'SoR-K2', 'SoR-K3', 'SoR-K4'],
  'Consistency': ['SoR-CN1', 'SoR-CN2', 'SoR-CN3', 'SoR-CN4'],
  'Problem Solving': ['CR-P1', 'CR-P2', 'CR-P3', 'CR-P4'],
  'Execution': ['CR-E1', 'CR-E2', 'CR-E3', 'CR-E4'],
  'Adaptability': ['CR-AD1', 'CR-AD2', 'CR-AD3', 'CR-AD4'],
  'Leadership & Influence': ['CR-L1', 'CR-L2', 'CR-L3', 'CR-L4']
};

export const MATURITY_LEVELS = [
  { min: 1.00, max: 1.74, level: 1, name: 'Emerging Leader', badge: 'Level 1 - Emerging Leader', color: 'slate' },
  { min: 1.75, max: 2.49, level: 2, name: 'Developing Leader', badge: 'Level 2 - Developing Leader', color: 'amber' },
  { min: 2.50, max: 3.24, level: 3, name: 'Transformative Leader', badge: 'Level 3 - Transformative Leader', color: 'teal' },
  { min: 3.25, max: 4.00, level: 4, name: 'Resilient Leader', badge: 'Level 4 - Resilient Leader', color: 'emerald' }
];

export function getMaturityLevel(score) {
  if (typeof score !== 'number' || isNaN(score)) return MATURITY_LEVELS[0];
  const rounded = Math.round(score * 100) / 100;
  for (const m of MATURITY_LEVELS) {
    if (rounded >= m.min && (rounded <= m.max || m.level === 4)) {
      return m;
    }
  }
  return score < 1.0 ? MATURITY_LEVELS[0] : MATURITY_LEVELS[3];
}

export function getGapInterpretation(gap) {
  if (gap === null || gap === undefined || isNaN(gap)) {
    return { category: 'Belum Dinilai', color: 'slate', alertLevel: 'none' };
  }
  const absGap = Math.abs(gap);
  if (absGap < 0.25) {
    return { category: 'Selaras', color: 'emerald', alertLevel: 'info', desc: 'Persepsi diri selaras dengan observasi fasilitator.' };
  } else if (absGap < 0.50) {
    return { category: 'Perlu refleksi', color: 'sky', alertLevel: 'notice', desc: 'Terdapat sedikit perbedaan persepsi yang dapat direfleksikan bersama.' };
  } else if (absGap < 0.75) {
    return { category: 'Significant Awareness Gap', color: 'amber', alertLevel: 'warning', desc: 'Terdapat celah kesadaran signifikan antara persepsi diri dan perilaku teramati.' };
  } else {
    return { category: 'Critical Awareness Gap', color: 'rose', alertLevel: 'danger', desc: 'Celah persepsi kritis, membutuhkan dialog coaching mendalam.' };
  }
}

/**
 * Calculate scores for 16 subdimensions and 4 dimensions from raw answer dict { 'VR-S1': 4, ... }
 */
export function calculateAssessmentScores(answers) {
  const subdimensions = {};
  
  for (const [subName, codes] of Object.entries(SUBDIMENSIONS_MAP)) {
    let sum = 0;
    let count = 0;
    for (const code of codes) {
      const val = parseFloat(answers[code]);
      if (!isNaN(val)) {
        sum += val;
        count++;
      }
    }
    subdimensions[subName] = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
  }

  // Dimensions
  const dimensions = {};
  for (const [dimName, subNames] of Object.entries(DIMENSIONS_MAP)) {
    let sum = 0;
    for (const sub of subNames) {
      sum += (subdimensions[sub] || 0);
    }
    dimensions[dimName] = Math.round((sum / subNames.length) * 100) / 100;
  }

  const vr = dimensions['Value Resilience'] || 0;
  const sr = dimensions['Self Resilience'] || 0;
  const sor = dimensions['Social Resilience'] || 0;
  const cr = dimensions['Change Resilience'] || 0;

  const overall = Math.round(((vr + sr + sor + cr) / 4) * 100) / 100;

  return {
    subdimensions,
    dimensions,
    vr,
    sr,
    sor,
    cr,
    overall
  };
}

/**
 * Consolidate Self and Facilitator assessment into Final RELI Score
 */
export function consolidateReliScores(selfAssessment, facilAssessment, baselineConsolidated = null) {
  const selfScore = selfAssessment ? selfAssessment.overall_score : null;
  const facilScore = facilAssessment ? facilAssessment.overall_score : null;

  let finalReli = null;
  let gapScore = null;

  if (selfScore !== null && facilScore !== null) {
    finalReli = Math.round(((selfScore * 0.5) + (facilScore * 0.5)) * 100) / 100;
    gapScore = Math.round((selfScore - facilScore) * 100) / 100;
  } else if (selfScore !== null) {
    finalReli = selfScore;
  } else if (facilScore !== null) {
    finalReli = facilScore;
  }

  const gapInfo = getGapInterpretation(gapScore);
  const maturity = getMaturityLevel(finalReli);

  // Consolidate Dimensions
  const dimensions = {};
  for (const dimName of Object.keys(DIMENSIONS_MAP)) {
    const sDim = selfAssessment?.dimensions?.[dimName] ?? (
      dimName === 'Value Resilience' ? selfAssessment?.vr_score :
      dimName === 'Self Resilience' ? selfAssessment?.sr_score :
      dimName === 'Social Resilience' ? selfAssessment?.sor_score :
      selfAssessment?.cr_score
    ) ?? null;

    const fDim = facilAssessment?.dimensions?.[dimName] ?? (
      dimName === 'Value Resilience' ? facilAssessment?.vr_score :
      dimName === 'Self Resilience' ? facilAssessment?.sr_score :
      dimName === 'Social Resilience' ? facilAssessment?.sor_score :
      facilAssessment?.cr_score
    ) ?? null;

    let finalDim = null;
    let gapDim = null;
    if (sDim !== null && fDim !== null) {
      finalDim = Math.round(((sDim * 0.5) + (fDim * 0.5)) * 100) / 100;
      gapDim = Math.round((sDim - fDim) * 100) / 100;
    } else {
      finalDim = sDim ?? fDim;
    }

    dimensions[dimName] = {
      self: sDim,
      facil: fDim,
      final: finalDim,
      gap: gapDim
    };
  }

  // Consolidate Subdimensions
  const selfSub = typeof selfAssessment?.subdimensions_json === 'string' ? 
    JSON.parse(selfAssessment.subdimensions_json) : (selfAssessment?.subdimensions || {});
  const facilSub = typeof facilAssessment?.subdimensions_json === 'string' ? 
    JSON.parse(facilAssessment.subdimensions_json) : (facilAssessment?.subdimensions || {});

  const subdimensions = {};
  for (const subName of Object.keys(SUBDIMENSIONS_MAP)) {
    const sVal = selfSub[subName] ?? null;
    const fVal = facilSub[subName] ?? null;

    let finalSub = null;
    let gapSub = null;
    if (sVal !== null && fVal !== null) {
      finalSub = Math.round(((sVal * 0.5) + (fVal * 0.5)) * 100) / 100;
      gapSub = Math.round((sVal - fVal) * 100) / 100;
    } else {
      finalSub = sVal ?? fVal;
    }

    subdimensions[subName] = {
      self: sVal,
      facil: fVal,
      final: finalSub,
      gap: gapSub
    };
  }

  // Calculate Growth vs Baseline (T0)
  let growthDelta = null;
  let growthRate = null;
  if (baselineConsolidated && typeof baselineConsolidated.final_reli === 'number' && baselineConsolidated.final_reli > 0 && finalReli !== null) {
    growthDelta = Math.round((finalReli - baselineConsolidated.final_reli) * 100) / 100;
    growthRate = Math.round(((finalReli - baselineConsolidated.final_reli) / baselineConsolidated.final_reli) * 10000) / 100;
  }

  return {
    self_score: selfScore,
    facil_score: facilScore,
    final_reli: finalReli,
    gap_score: gapScore,
    gap_category: gapInfo.category,
    maturity_level: maturity.name,
    maturity_badge: maturity.badge,
    dimensions,
    subdimensions,
    growth_delta: growthDelta,
    growth_rate: growthRate
  };
}

/**
 * Convert first-person (Self / "Saya") statements to third-person (Fasilitator POV / "Etoser")
 */
export function convertToFasilPOV(text) {
  if (!text || typeof text !== 'string') return text;
  let res = text;

  res = res.replace(/^Saya /g, 'Etoser ');
  res = res.replace(/\bdiri saya\b/gi, 'dirinya');
  res = res.replace(/\bbagi saya\b/gi, 'baginya');
  res = res.replace(/\bkepada saya\b/gi, 'kepadanya');
  res = res.replace(/\bpada saya\b/gi, 'padanya');
  res = res.replace(/\boleh saya\b/gi, 'olehnya');
  res = res.replace(/\bdengan saya\b/gi, 'dengannya');
  res = res.replace(/\buntuk saya\b/gi, 'untuknya');
  res = res.replace(/\byang saya\b/gi, 'yang Etoser');
  res = res.replace(/\bketika saya\b/gi, 'ketika Etoser');
  res = res.replace(/\bsaat saya\b/gi, 'saat Etoser');
  res = res.replace(/\bagar saya\b/gi, 'agar Etoser');
  res = res.replace(/\bjika saya\b/gi, 'jika Etoser');
  res = res.replace(/\bapabila saya\b/gi, 'apabila Etoser');
  res = res.replace(/\bmeskipun saya\b/gi, 'meskipun Etoser');
  res = res.replace(/\bwalaupun saya\b/gi, 'walaupun Etoser');
  res = res.replace(/\bsebelum saya\b/gi, 'sebelum Etoser');
  res = res.replace(/\bsetelah saya\b/gi, 'setelah Etoser');
  res = res.replace(/\bhingga saya\b/gi, 'hingga Etoser');
  res = res.replace(/\bsampai saya\b/gi, 'sampai Etoser');
  res = res.replace(/\bsupaya saya\b/gi, 'supaya Etoser');
  res = res.replace(/\bkarena saya\b/gi, 'karena Etoser');
  res = res.replace(/\btetapi saya\b/gi, 'tetapi Etoser');
  res = res.replace(/\bnamun saya\b/gi, 'namun Etoser');
  res = res.replace(/\bdan saya\b/gi, 'dan Etoser');
  res = res.replace(/\bSaya\b/g, 'Etoser');
  res = res.replace(/\bsaya\b/g, 'Etoser');

  return res;
}

