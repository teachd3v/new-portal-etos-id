import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

function findSqliteFile(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = findSqliteFile(fullPath);
      if (found) return found;
    } else if (file.endsWith('.sqlite')) {
      return fullPath;
    }
  }
  return null;
}

const miniflareDir = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const sqlitePath = findSqliteFile(miniflareDir);
const client = createClient({ url: 'file:' + sqlitePath });

async function run() {
  const userId = 'E2023092';
  try {
    const openPeriods = await client.execute("SELECT * FROM periode_penilaian WHERE is_open = 1 AND tipe_instrumen = 'RELI'");
    console.log('Open periods:', openPeriods.rows);

    const activePeriod = openPeriods.rows[0];
    const periodeKode = activePeriod?.kode_periode || 'T0';

    const existing = await client.execute({
      sql: "SELECT * FROM reli_assessments WHERE user_id = ? AND evaluator_type = 'SELF' AND periode_kode = ?",
      args: [userId, periodeKode]
    });
    console.log('Existing count:', existing.rows.length);

    const questions = await client.execute("SELECT * FROM reli_instrumen ORDER BY order_num ASC");
    console.log('Questions count:', questions.rows.length);

    const isSubmitted = existing.rows.length > 0;
    const existingSubmission = isSubmitted ? existing.rows[0] : null;

    const res = {
      isOpen: true,
      period: activePeriod,
      isSubmitted,
      existingAnswers: existingSubmission ? (typeof existingSubmission.raw_answers === 'string' ? JSON.parse(existingSubmission.raw_answers) : existingSubmission.raw_answers) : null,
      existingScore: existingSubmission ? existingSubmission.overall_score : null,
      existingMaturityLevel: existingSubmission ? (
        existingSubmission.overall_score >= 3.25 ? 'Resilient Leader' :
        existingSubmission.overall_score >= 2.50 ? 'Transformative Leader' :
        existingSubmission.overall_score >= 1.75 ? 'Developing Leader' : 'Emerging Leader'
      ) : null,
      submittedAt: existingSubmission ? existingSubmission.timestamp : null,
      questions: questions.rows
    };
    console.log('Response prepared successfully! isSubmitted:', res.isSubmitted, 'existingScore:', res.existingScore);
  } catch(e) {
    console.error('API Simulation Error:', e);
  }
}
run();
