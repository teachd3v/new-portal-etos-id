const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'app', 'api', 'admin');

function createDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generateRoute(table, isSettings = false) {
  if (isSettings) {
    return `import { NextResponse } from 'next/server';
import { db } from '@/db';
import { app_settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const data = await db.select().from(app_settings);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json(); // Expected: array of {key, value}
    
    // SQLite D1 bulk upsert workaround: insert one by one or delete then insert
    // For simplicity, we loop and upsert based on key (we'll delete existing keys then insert new)
    for (const item of body) {
      const existing = await db.select().from(app_settings).where(eq(app_settings.key, item.key));
      if (existing.length > 0) {
        await db.update(app_settings).set({ value: item.value, updated_at: new Date().toISOString() }).where(eq(app_settings.key, item.key));
      } else {
        await db.insert(app_settings).values({ id: 'SET-' + Date.now() + Math.random(), key: item.key, value: item.value, updated_at: new Date().toISOString() });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
`;
  }

  return `import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ${table} } from '@/db/schema';

export async function GET(req) {
  try {
    const data = await db.select().from(${table});
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const id = '${table.split('_')[0].toUpperCase()}-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2,6);
    const newData = await db.insert(${table}).values({ id, ...body }).returning();
    return NextResponse.json(newData[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create data" }, { status: 500 });
  }
}
`;
}

function generateIdRoute(table) {
  return `import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ${table} } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await db.update(${table}).set(body).where(eq(${table}.id, id)).returning();
    if (updated.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const deleted = await db.delete(${table}).where(eq(${table}.id, id)).returning();
    if (deleted.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
}
`;
}

const resources = [
  { path: 'settings', table: 'app_settings', isSettings: true },
  { path: 'instrumen/etoser', table: 'instrumen_etoser', isSettings: false },
  { path: 'instrumen/fasil', table: 'instrumen_fasil', isSettings: false },
  { path: 'instrumen/peer', table: 'instrumen_peer', isSettings: false },
  { path: 'sanksi', table: 'katalog_sanksi', isSettings: false },
];

resources.forEach(res => {
  const resourceDir = path.join(apiDir, res.path);
  createDir(resourceDir);
  fs.writeFileSync(path.join(resourceDir, 'route.js'), generateRoute(res.table, res.isSettings));
  
  if (!res.isSettings) {
    const idDir = path.join(resourceDir, '[id]');
    createDir(idDir);
    fs.writeFileSync(path.join(idDir, 'route.js'), generateIdRoute(res.table));
  }
});

console.log("APIs scaffolded successfully.");
