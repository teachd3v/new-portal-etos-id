const fs = require('fs');
const path = require('path');

const resources = [
  { path: 'instrumen/etoser', table: 'instrumen_etoser', prefix: 'INSTRUMEN_ETOSER' },
  { path: 'instrumen/fasil', table: 'instrumen_fasil', prefix: 'INSTRUMEN_FASIL' },
  { path: 'instrumen/peer', table: 'instrumen_peer', prefix: 'INSTRUMEN_PEER' },
  { path: 'sanksi', table: 'katalog_sanksi', prefix: 'KATALOG_SANKSI' },
];

resources.forEach(res => {
  const filepath = path.join(__dirname, 'src', 'app', 'api', 'admin', res.path, 'route.js');
  let content = `import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ${res.table} } from '@/db/schema';

export async function GET(req) {
  try {
    const data = await db.select().from(${res.table});
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    if (Array.isArray(body)) {
      const dataToInsert = body.map(item => ({ 
        id: '${res.prefix}-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2,6), 
        ...item 
      }));
      // SQLite batch insert
      const newData = await db.insert(${res.table}).values(dataToInsert).returning();
      return NextResponse.json(newData);
    } else {
      const id = '${res.prefix}-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2,6);
      const newData = await db.insert(${res.table}).values({ id, ...body }).returning();
      return NextResponse.json(newData[0]);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create data" }, { status: 500 });
  }
}
`;
  fs.writeFileSync(filepath, content);
});

console.log("APIs updated for bulk insert support.");
