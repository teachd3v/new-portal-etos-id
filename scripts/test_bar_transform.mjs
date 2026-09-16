import fs from 'fs';
const items = JSON.parse(fs.readFileSync('scripts/reli_items_data.json', 'utf8'));

export function convertToFasilPOV(text) {
  if (!text) return text;
  let res = text;

  // Replacements
  res = res.replace(/^Saya /g, 'Etoser ');
  res = res.replace(/\bdiri saya\b/gi, 'dirinya');
  res = res.replace(/\bbagi saya\b/gi, 'baginya');
  res = res.replace(/\bkepada saya\b/gi, 'kepadanya');
  res = res.replace(/\bpada saya\b/gi, 'padanya');
  res = res.replace(/\boleh saya\b/gi, 'olehnya');
  res = res.replace(/\bdengan saya\b/gi, 'dengannya');
  res = res.replace(/\buntuk saya\b/gi, 'untuknya');
  res = res.replace(/\byang saya\b/gi, 'yang Etoser');
  res = res.replace(/\bketika saya\b/gi, 'ketika Etoser');
  res = res.replace(/\bsaat saya\b/gi, 'saat Etoser');
  res = res.replace(/\bagar saya\b/gi, 'agar Etoser');
  res = res.replace(/\bjika saya\b/gi, 'jika Etoser');
  res = res.replace(/\bapabila saya\b/gi, 'apabila Etoser');
  res = res.replace(/\bmeskipun saya\b/gi, 'meskipun Etoser');
  res = res.replace(/\bwalaupun saya\b/gi, 'walaupun Etoser');
  res = res.replace(/\bsebelum saya\b/gi, 'sebelum Etoser');
  res = res.replace(/\bsetelah saya\b/gi, 'setelah Etoser');
  res = res.replace(/\bhingga saya\b/gi, 'hingga Etoser');
  res = res.replace(/\bsampai saya\b/gi, 'sampai Etoser');
  res = res.replace(/\bsupaya saya\b/gi, 'supaya Etoser');
  res = res.replace(/\bkarena saya\b/gi, 'karena Etoser');
  res = res.replace(/\btetapi saya\b/gi, 'tetapi Etoser');
  res = res.replace(/\bnamun saya\b/gi, 'namun Etoser');
  res = res.replace(/\bdan saya\b/gi, 'dan Etoser');
  res = res.replace(/\bSaya\b/g, 'Etoser');
  res = res.replace(/\bsaya\b/g, 'Etoser');

  return res;
}

console.log('Sample conversions:');
for (let i = 0; i < 5; i++) {
  const item = items[i];
  console.log(`\n[${item.kode}] ${item.judul}`);
  console.log('Level 1 Self :', item.bar_level_1);
  console.log('Level 1 Fasil:', convertToFasilPOV(item.bar_level_1));
  console.log('Level 4 Self :', item.bar_level_4);
  console.log('Level 4 Fasil:', convertToFasilPOV(item.bar_level_4));
}
