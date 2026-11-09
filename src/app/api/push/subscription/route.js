import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, push_subscriptions, push_broadcasts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuthUser } from '@/lib/auth';
import { getVapidConfig, sendWebPushNotification } from '@/lib/webpush';
import { ensurePushTables, normalizePushRole } from '@/lib/push-db';

export async function GET(req) {
  try {
    await ensurePushTables();
    const authUser = await getAuthUser(req);
    const { publicKey } = getVapidConfig();

    if (!authUser) {
      return NextResponse.json({
        success: true,
        publicKey,
        isSubscribed: false,
        subscribedCount: 0,
        broadcasts: [],
      });
    }

    const { searchParams } = new URL(req.url);
    const checkEndpoint = searchParams.get('endpoint');
    const userRole = normalizePushRole(authUser.role);

    const [userSubs, allBroadcasts] = await Promise.all([
      db
        .select()
        .from(push_subscriptions)
        .where(eq(push_subscriptions.user_id, authUser.id)),
      db
        .select()
        .from(push_broadcasts)
        .orderBy(desc(push_broadcasts.created_at))
        .limit(25),
    ]);

    const relevantBroadcasts = allBroadcasts
      .filter((b) => {
        const target = String(b.target_role || 'ALL').toUpperCase();
        if (userRole === 'ADMIN') return true;
        return target === 'ALL' || target === userRole;
      })
      .slice(0, 15);

    const isEndpointSubscribed = checkEndpoint
      ? userSubs.some((s) => s.endpoint === checkEndpoint)
      : userSubs.length > 0;

    return NextResponse.json({
      success: true,
      publicKey,
      isSubscribed: isEndpointSubscribed,
      subscribedCount: userSubs.length,
      broadcasts: relevantBroadcasts,
    });
  } catch (error) {
    console.error('GET /api/push/subscription error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat status notifikasi' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await ensurePushTables();
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const subscription = body.subscription || body;
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh || subscription?.p256dh;
    const auth = subscription?.keys?.auth || subscription?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: 'Data langganan push (endpoint / keys) tidak lengkap' },
        { status: 400 }
      );
    }

    // Look up user details for richer targeting (wilayah, angkatan, name)
    let userName = authUser.name || authUser.id;
    let wilayah = null;
    let angkatan = null;
    const normalizedRole = normalizePushRole(authUser.role);

    try {
      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.id, authUser.id));
      if (userRows.length > 0) {
        userName = userRows[0].name || userName;
        wilayah = userRows[0].wilayah || null;
        angkatan = userRows[0].angkatan || null;
      }
    } catch {
      // Non-fatal
    }

    const nowIso = new Date().toISOString();
    const userAgent = req.headers.get('user-agent') || '';

    // Check if endpoint already exists
    const existing = await db
      .select()
      .from(push_subscriptions)
      .where(eq(push_subscriptions.endpoint, endpoint));

    let subId;
    if (existing.length > 0) {
      subId = existing[0].id;
      await db
        .update(push_subscriptions)
        .set({
          user_id: authUser.id,
          user_name: userName,
          role: normalizedRole,
          wilayah,
          angkatan,
          p256dh,
          auth,
          user_agent: userAgent,
          updated_at: nowIso,
        })
        .where(eq(push_subscriptions.id, subId));
    } else {
      subId = `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(push_subscriptions).values({
        id: subId,
        user_id: authUser.id,
        user_name: userName,
        role: normalizedRole,
        wilayah,
        angkatan,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    let testResult = null;
    if (body.sendTest) {
      testResult = await sendWebPushNotification(
        { endpoint, p256dh, auth },
        {
          title: 'Notifikasi Portal Etos ID Aktif! 🔔',
          body: `Halo ${userName}, perangkatmu kini siap menerima kabar pembaruan & pengumuman penting.`,
          url: '/',
          category: 'PENGUMUMAN',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          timestamp: Date.now(),
        }
      );
    }

    return NextResponse.json({
      success: true,
      id: subId,
      testSent: testResult ? testResult.ok : false,
    });
  } catch (error) {
    console.error('POST /api/push/subscription error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan langganan notifikasi' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await ensurePushTables();
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let endpoint = null;
    try {
      const body = await req.json();
      endpoint = body?.endpoint;
    } catch {
      const { searchParams } = new URL(req.url);
      endpoint = searchParams.get('endpoint');
    }

    if (endpoint) {
      await db
        .delete(push_subscriptions)
        .where(eq(push_subscriptions.endpoint, endpoint));
    } else {
      await db
        .delete(push_subscriptions)
        .where(eq(push_subscriptions.user_id, authUser.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/push/subscription error:', error);
    return NextResponse.json(
      { error: 'Gagal menonaktifkan langganan notifikasi' },
      { status: 500 }
    );
  }
}
