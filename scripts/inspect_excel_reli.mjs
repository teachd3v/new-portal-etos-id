import xlsx from 'xlsx';
import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.xlsx'));
console.log('Found xlsx files:', files);

if (files.length > 0) {
  const wb = xlsx.readFile(files[0]);
  console.log('Sheet names:', wb.SheetNames);
  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} (Rows: ${data.length}) ---`);
    console.log('Header row:', data[0]);
    if (data.length > 1) {
      console.log('Sample row 1:', data[1]);
    }
  });
}
