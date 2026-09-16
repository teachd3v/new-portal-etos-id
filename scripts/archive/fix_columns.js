const fs = require('fs');
const path = require('path');

const fixEtoser = () => {
  const filepath = path.join(__dirname, 'src', 'components', 'admin', 'settings', 'InstrumenEtoserTab.js');
  let content = fs.readFileSync(filepath, 'utf8');

  // Fix templateHeaders
  content = content.replace(
    /templateHeaders=\{\["tahun_pembinaan","variabel","kode","jenis_skala","indikator","item_pernyataan"\]\}/,
    `templateHeaders={["tahun_pembinaan","variabel","kode","jenis_skala","indikator","item_pernyataan","pertanyaan_validasi"]}`
  );

  // Add Table Header
  content = content.replace(
    /<th className="p-4 font-semibold">Pernyataan<\/th>/,
    `<th className="p-4 font-semibold">Pernyataan</th>\n              <th className="p-4 font-semibold">Validasi</th>`
  );

  // Add Table Data
  content = content.replace(
    /<td className="p-4 text-sm text-teal-900">\{row\.item_pernyataan\}<\/td>/,
    `<td className="p-4 text-sm text-teal-900">{row.item_pernyataan}</td>\n                <td className="p-4 text-sm text-teal-900">{row.pertanyaan_validasi || '-'}</td>`
  );

  // Add Form Input
  const formInput = `
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Pertanyaan Validasi</label>
                <input type="text" value={formData.pertanyaan_validasi || ''} onChange={e => setFormData({...formData, pertanyaan_validasi: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>`;
  content = content.replace(
    /<button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">Simpan<\/button>/,
    `${formInput}\n              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">Simpan</button>`
  );

  fs.writeFileSync(filepath, content);
};

const fixFasil = () => {
  const filepath = path.join(__dirname, 'src', 'components', 'admin', 'settings', 'InstrumenFasilTab.js');
  let content = fs.readFileSync(filepath, 'utf8');

  // Fix templateHeaders
  content = content.replace(
    /templateHeaders=\{\["role","kode","jenis_skala","item_pernyataan"\]\}/,
    `templateHeaders={["role","kode","jenis_skala","item_pernyataan","pertanyaan_validasi"]}`
  );

  // Add Table Header
  content = content.replace(
    /<th className="p-4 font-semibold">Pernyataan<\/th>/,
    `<th className="p-4 font-semibold">Pernyataan</th>\n              <th className="p-4 font-semibold">Validasi</th>`
  );

  // Add Table Data
  content = content.replace(
    /<td className="p-4 text-sm text-teal-900">\{row\.item_pernyataan\}<\/td>/,
    `<td className="p-4 text-sm text-teal-900">{row.item_pernyataan}</td>\n                <td className="p-4 text-sm text-teal-900">{row.pertanyaan_validasi || '-'}</td>`
  );

  // Add Form Input
  const formInput = `
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Pertanyaan Validasi</label>
                <input type="text" value={formData.pertanyaan_validasi || ''} onChange={e => setFormData({...formData, pertanyaan_validasi: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>`;
  content = content.replace(
    /<button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">Simpan<\/button>/,
    `${formInput}\n              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">Simpan</button>`
  );

  fs.writeFileSync(filepath, content);
};

fixEtoser();
fixFasil();
console.log("Columns added successfully to Etoser and Fasil tabs.");
