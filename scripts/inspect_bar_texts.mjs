import fs from 'fs';
const items = JSON.parse(fs.readFileSync('scripts/reli_items_data.json', 'utf8'));

let totalSaya = 0;
items.forEach(item => {
  ['bar_level_1', 'bar_level_2', 'bar_level_3', 'bar_level_4'].forEach(levelKey => {
    const text = item[levelKey];
    if (text.includes('Saya') || text.includes('saya')) {
      totalSaya++;
    }
  });
});
console.log('Total BAR statements containing Saya/saya:', totalSaya, 'out of', items.length * 4);
