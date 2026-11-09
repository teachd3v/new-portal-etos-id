import { NextResponse } from 'next/server';
import { db } from '@/db';
import { push_subscriptions, push_broadcasts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { sendWebPushNotification } from '@/lib/webpush';
import {
  ensurePushTables,
  normalizePushRole,
  dispatchPushBroadcast,
} from '@/lib/push-db';

export async function GET() {
  try {
    await ensurePushTables();

    const [subs, broadcasts] = await Promise.all([
      db
        .select()
        .from(push_subscriptions)
        .orderBy(desc(push_subscriptions.updated_at)),
      db
        .select()
        .from(push_broadcasts)
        .orderBy(desc(push_broadcasts.created_at))
        .limit(40),
    ]);

    const byRole = { ETOSER: 0, FASIL: 0, ADMIN: 0 };
    const uniqueUserSet = new Set();

    subs.forEach((s) => {
      const r = normalizePushRole(s.role);
      byRole[r] = (byRole[r] || 0) + 1;
      if (s.user_id) uniqueUserSet.add(s.user_id);
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalDevices: subs.length,
        uniqueUsers: uniqueUserSet.size,
        etoserDevices: byRole.ETOSER || 0,
        fasilDevices: byRole.FASIL || 0,
        adminDevices: byRole.ADMIN || 0,
      },
      subscriptions: subs.slice(0, 50),
      broadcasts,
    });
  } catch (error) {
    console.error('GET /api/admin/push/broadcast error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data broadcast notifikasi' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await ensurePushTables();
    const authUser = await getAuthUser(req);
    const body = await req.json();

    const {
      action = 'broadcast',
      title,
      message,
      body: bodyText,
      url = '/',
      category = 'UPDATE_FITUR',
      targetRole = 'ALL',
    } = body;

    const finalTitle = (title || '').trim();
    const finalBody = (bodyText || message || '').trim();

    if (!finalTitle || !finalBody) {
      return NextResponse.json(
        { error: 'Judul dan isi pesan notifikasi wajib diisi' },
        { status: 400 }
      );
    }

    // Mode 1: Preview / Test push only to Admin's own devices
    if (action === 'test_self') {
      if (!authUser?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const adminSubs = await db
        .select()
        .from(push_subscriptions)
        .where(eq(push_subscriptions.user_id, authUser.id));

      if (adminSubs.length === 0) {
        return NextResponse.json(
          {
            error:
              'Perangkat Admin belum mengaktifkan Push Notifikasi. Klik "Aktifkan Notifikasi di Perangkat Ini" terlebih dahulu.',
          },
          { status: 400 }
        );
      }

      let sent = 0;
      await Promise.allSettled(
        adminSubs.map(async (sub) => {
          const res = await sendWebPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            {
              title: `[PREVIEW] ${finalTitle}`,
              body: finalBody,
              url: url || '/',
              category,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-96x96.png',
              timestamp: Date.now(),
            }
          );
          if (res.ok) sent++;
        })
      );

      return NextResponse.json({
        success: true,
        mode: 'test_self',
        targeted: adminSubs.length,
        sent,
      });
    }

    // Mode 2: Full Broadcast
    const result = await dispatchPushBroadcast({
      title: finalTitle,
      body: finalBody,
      url: url || '/',
      category,
      targetRole,
      sentBy: authUser?.name || authUser?.id || 'Admin',
    });

    return NextResponse.json({
      success: true,
      mode: 'broadcast',
      ...result,
    });
  } catch (error) {
    console.error('POST /api/admin/push/broadcast error:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim broadcast notifikasi' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await ensurePushTables();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const subscriptionId = searchParams.get('subscriptionId');

    if (id) {
      await db.delete(push_broadcasts).where(eq(push_broadcasts.id, id));
      return NextResponse.json({ success: true });
    }

    if (subscriptionId) {
      await db
        .delete(push_subscriptions)
        .where(eq(push_subscriptions.id, subscriptionId));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 });
  } catch (error) {
    console.error('DELETE /api/admin/push/broadcast error:', error);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
