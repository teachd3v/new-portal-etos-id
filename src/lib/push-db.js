import { db } from '@/db';
import { push_subscriptions, push_broadcasts } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { sendWebPushNotification } from '@/lib/webpush';

let tablesVerified = false;

export async function ensurePushTables() {
  if (tablesVerified) return;
  try {
    await db.run(
      sql.raw(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          user_name TEXT,
          role TEXT NOT NULL,
          wilayah TEXT,
          angkatan TEXT,
          endpoint TEXT NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          user_agent TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `)
    );

    await db.run(
      sql.raw(`
        CREATE TABLE IF NOT EXISTS push_broadcasts (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          url TEXT,
          category TEXT DEFAULT 'PENGUMUMAN',
          target_role TEXT DEFAULT 'ALL',
          sent_by TEXT,
          total_targeted INTEGER DEFAULT 0,
          total_success INTEGER DEFAULT 0,
          total_failed INTEGER DEFAULT 0,
          created_at TEXT NOT NULL
        )
      `)
    );
    tablesVerified = true;
  } catch (err) {
    console.error('Failed to ensure push tables:', err);
  }
}

export function normalizePushRole(rawRole) {
  const r = String(rawRole || '').toUpperCase().trim();
  if (r === 'ADMIN') return 'ADMIN';
  if (r.includes('FASIL')) return 'FASIL';
  return 'ETOSER';
}

/**
 * Reusable helper to send a push notification to specific users or broadcast to a role group.
 */
export async function dispatchPushBroadcast({
  title,
  body,
  url = '/',
  category = 'PENGUMUMAN',
  targetRole = 'ALL',
  sentBy = 'Admin',
}) {
  await ensurePushTables();

  const normalizedTarget = String(targetRole || 'ALL').toUpperCase();
  const allSubs = await db.select().from(push_subscriptions);

  const targetSubs = allSubs.filter((sub) => {
    if (normalizedTarget === 'ALL') return true;
    return normalizePushRole(sub.role) === normalizedTarget;
  });

  let totalSuccess = 0;
  let totalFailed = 0;
  const expiredIds = [];

  const payload = {
    title,
    body,
    url: url || '/',
    category,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    timestamp: Date.now(),
  };

  const results = await Promise.allSettled(
    targetSubs.map(async (sub) => {
      const res = await sendWebPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload
      );
      if (res.ok) {
        totalSuccess++;
      } else {
        totalFailed++;
        if (res.expired) {
          expiredIds.push(sub.id);
        }
      }
      return res;
    })
  );

  // Clean up expired / unsubscribed endpoints automatically
  if (expiredIds.length > 0) {
    try {
      await db
        .delete(push_subscriptions)
        .where(inArray(push_subscriptions.id, expiredIds));
    } catch (e) {
      console.error('Failed to clean expired push subscriptions:', e);
    }
  }

  const broadcastRecord = {
    id: `BRC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    url: url || '/',
    category,
    target_role: normalizedTarget,
    sent_by: sentBy,
    total_targeted: targetSubs.length,
    total_success: totalSuccess,
    total_failed: totalFailed,
    created_at: new Date().toISOString(),
  };

  await db.insert(push_broadcasts).values(broadcastRecord);

  return {
    broadcast: broadcastRecord,
    cleanedExpired: expiredIds.length,
    resultsCount: results.length,
  };
}
