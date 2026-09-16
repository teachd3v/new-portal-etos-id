import { NextResponse } from 'next/server';
import { db } from '@/db';
import { portofolio } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyJwt } from '@/lib/auth';

export async function DELETE(req, { params }) {
  try {
    const { id: portofolioId } = await params;
    
    const authHeader = req.headers.get('cookie');
    const token = authHeader?.split('auth_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const decoded = await verifyJwt(token);
    if (!decoded || !decoded.role.toUpperCase().includes('FASIL')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify ownership
    const existing = await db.select().from(portofolio).where(
      and(eq(portofolio.id, portofolioId), eq(portofolio.user_id, decoded.id))
    );
    
    if (!existing.length) {
      return NextResponse.json({ error: 'Data not found or not authorized' }, { status: 404 });
    }

    await db.delete(portofolio).where(eq(portofolio.id, portofolioId));

    return NextResponse.json({ success: true, message: 'Berhasil dihapus' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
