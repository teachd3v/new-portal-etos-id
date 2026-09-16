import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, reports, report_answers } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const wilayah = searchParams.get('wilayah') || 'all';

    // 1. Fetch Users
    const allUsers = await db.select().from(users);
    let fasils = allUsers.filter(u => u.role && u.role.toUpperCase().includes('FASIL'));
    if (wilayah !== 'all') fasils = fasils.filter(u => u.wilayah === wilayah);
    
    const totalFasil = fasils.length;

    // 2. Fetch Reports for current period
    const today = new Date();
    const targetMonth = today.getMonth() + 1;
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonthName = monthNames[targetMonth - 1];
    const currentYearStr = today.getFullYear().toString();

    const allReports = await db.select().from(reports);
    const currentPeriodReports = allReports.filter(r => r.period_month === currentMonthName && r.period_year === currentYearStr);

    const fasilMengisiMandiri = new Set(currentPeriodReports.filter(r => r.type === 'FASIL_SELF_ASSESSMENT').map(r => r.user_id)).size;
    
    // We can't directly get fasilMenilaiEtoser accurately since reviewer ID isn't in reports.
    // Approximating based on if there are Peer assessments in their wilayah
    const peerReports = currentPeriodReports.filter(r => r.type === 'FASIL_PEER_ASSESSMENT');
    const fasilMenilaiEtoser = Math.min(totalFasil, peerReports.length > 0 ? Math.ceil(peerReports.length / 5) : 0);

    // 3. Process Fasil Self Assessment Scores
    const fasilIds = fasils.map(f => f.id);
    let leaderboardData = [];
    let skorFasilData = [];

    if (fasilIds.length > 0) {
      const selfReports = allReports.filter(r => r.type === 'FASIL_SELF_ASSESSMENT' && fasilIds.includes(r.user_id));
      const reportIds = selfReports.map(r => r.id);
      
      let allAnswers = [];
      if (reportIds.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < reportIds.length; i += chunkSize) {
          const chunk = reportIds.slice(i, i + chunkSize);
          const ans = await db.select().from(report_answers).where(inArray(report_answers.report_id, chunk));
          allAnswers = [...allAnswers, ...ans];
        }
      }

      leaderboardData = fasils.map((f, index) => {
        const fReports = selfReports.filter(r => r.user_id === f.id);
        const fAns = allAnswers.filter(a => fReports.map(r => r.id).includes(a.report_id));
        
        let avgScore = 0;
        if (fAns.length > 0) {
           const sum = fAns.reduce((acc, curr) => acc + (curr.score || 0), 0);
           avgScore = (sum / fAns.length); // 1-4 scale
        }

        // Convert 1-4 to 0-100 scale for leaderboard consistency if needed, but 1-4 is fine.
        // Let's multiply by 25 to get 0-100 scale for easier reading
        const finalScore = avgScore > 0 ? (avgScore * 25).toFixed(1) : 0;

        // Calculate progress peer
        let binaanIds = [];
        if (f.relasi_etoser && f.relasi_etoser.trim() !== '') {
          binaanIds = f.relasi_etoser.split(',').map(id => id.trim()).filter(Boolean);
        } else {
          binaanIds = allUsers.filter(u => (u.role === 'Etoser' || u.role === 'PM') && u.wilayah === f.wilayah).map(u => u.id);
        }

        const donePeer = currentPeriodReports.filter(r => r.type === 'FASIL_PEER_ASSESSMENT' && binaanIds.includes(r.user_id)).length;
        const totalBinaan = binaanIds.length;
        const percentage = totalBinaan > 0 ? Math.round((donePeer / totalBinaan) * 100) : 0;

        return {
          id: f.id,
          name: f.name,
          role: f.fasil_role || 'Reguler',
          wilayah: f.wilayah || '-',
          laporMandiri: fReports.length > 0 ? '100%' : '0%',
          progressPeer: `${percentage}%`,
          peerDetail: `${donePeer}/${totalBinaan}`,
          rataSkor: finalScore,
          status: finalScore == 0 ? 'Belum Dinilai' : finalScore >= 80 ? 'Sangat Baik' : 'Perlu Ditingkatkan'
        };
      });

      leaderboardData.sort((a, b) => b.rataSkor - a.rataSkor);
      leaderboardData = leaderboardData.map((f, i) => ({ ...f, rank: i + 1 }));

      skorFasilData = leaderboardData.slice(0, 10).map(f => ({
        name: f.name,
        skor: parseFloat(f.rataSkor)
      }));
    }

    return NextResponse.json({
      stats: {
        totalFasil,
        fasilMengisiMandiri,
        fasilMenilaiEtoser
      },
      charts: {
        skorFasilData
      },
      table: leaderboardData
    });

  } catch (error) {
    console.error('Fasil Dashboard Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
