const fs = require('fs');
const path = require('path');

const apiEndpoints = [
  { file: 'users/route.js', table: 'users' },
  { file: 'instrumen/etoser/route.js', table: 'instrumen_etoser' },
  { file: 'instrumen/fasil/route.js', table: 'instrumen_fasil' },
  { file: 'instrumen/peer/route.js', table: 'instrumen_peer' },
  { file: 'sanksi/route.js', table: 'katalog_sanksi' }
];

// Update APIs
apiEndpoints.forEach(ep => {
  const filepath = path.join(__dirname, 'src', 'app', 'api', 'admin', ep.file);
  if (!fs.existsSync(filepath)) return;
  
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (!content.includes('export async function DELETE')) {
    // Add inArray import
    if (!content.includes('inArray')) {
      content = `import { inArray } from 'drizzle-orm';\n` + content;
    }
    
    const deleteFunc = `
export async function DELETE(req) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }
    await db.delete(${ep.table}).where(inArray(${ep.table}.id, ids));
    return NextResponse.json({ message: "Bulk delete successful" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`;
    content += deleteFunc;
    fs.writeFileSync(filepath, content);
  }
});

console.log("APIs updated.");
