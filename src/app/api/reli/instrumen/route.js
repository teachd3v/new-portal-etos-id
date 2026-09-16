import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reli_instrumen } from '@/db/schema';
import { asc, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    const items = await db.select().from(reli_instrumen).orderBy(asc(reli_instrumen.order_num));
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      kode, dimensi, subdimensi, judul,
      pernyataan_self, pernyataan_fasil,
      bar_level_1, bar_level_2, bar_level_3, bar_level_4
    } = body;

    if (!dimensi || !subdimensi || !judul || !pernyataan_self || !pernyataan_fasil) {
      return NextResponse.json({ error: 'Dimensi, Subdimensi, Judul, dan Pernyataan wajib diisi' }, { status: 400 });
    }

    // Get max order_num
    const existing = await db.select().from(reli_instrumen).orderBy(desc(reli_instrumen.order_num));
    const nextOrder = existing.length > 0 ? (existing[0].order_num || 0) + 1 : 1;

    const generatedKode = kode || `${dimensi.split(' ').map(w => w[0]).join('')}-${nextOrder}`;
    const id = generatedKode.toUpperCase().replace(/\s+/g, '-');

    await db.insert(reli_instrumen).values({
      id: `${id}-${crypto.randomBytes(2).toString('hex')}`,
      kode: generatedKode,
      dimensi,
      subdimensi,
      order_num: nextOrder,
      judul,
      pernyataan_self,
      pernyataan_fasil,
      bar_level_1: bar_level_1 || '',
      bar_level_2: bar_level_2 || '',
      bar_level_3: bar_level_3 || '',
      bar_level_4: bar_level_4 || ''
    });

    return NextResponse.json({ success: true, message: 'Butir instrumen RELI berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating RELI item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

