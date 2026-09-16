const fs = require('fs');
const path = require('path');

const tabs = [
  { file: 'InstrumenEtoserTab.js', endpoint: 'instrumen/etoser', headers: ['tahun_pembinaan', 'variabel', 'kode', 'jenis_skala', 'indikator', 'item_pernyataan'] },
  { file: 'InstrumenFasilTab.js', endpoint: 'instrumen/fasil', headers: ['role', 'kode', 'jenis_skala', 'item_pernyataan'] },
  { file: 'InstrumenPeerTab.js', endpoint: 'instrumen/peer', headers: ['indikator', 'kode', 'jenis_skala', 'item_pernyataan'] },
  { file: 'SanksiTab.js', endpoint: 'sanksi', headers: ['kategori', 'detail_pelanggaran', 'masa_perbaikan', 'poin', 'credit_perform'] },
];

tabs.forEach(tab => {
  const filepath = path.join(__dirname, 'src', 'components', 'admin', 'settings', tab.file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Add import
  content = content.replace(
    /import \{ Plus, Edit2, Trash2, X, Loader2 \} from 'lucide-react';/,
    `import { Plus, Edit2, Trash2, X, Loader2, Upload } from 'lucide-react';\nimport CsvImportModal from './CsvImportModal';`
  );

  // Add state
  content = content.replace(
    /const \[isModalOpen, setIsModalOpen\] = useState\(false\);/,
    `const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isImportOpen, setIsImportOpen] = useState(false);`
  );

  // Add buttons
  content = content.replace(
    /<button onClick=\{\(\) => \{ setFormData\(\{\}\); setIsModalOpen\(true\); \}\} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center gap-2">/,
    `<div className="flex gap-3">\n        <button onClick={() => setIsImportOpen(true)} className="bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-sm transition-all">\n          <Upload className="w-4 h-4" /> Import CSV\n        </button>\n        <button onClick={() => { setFormData({}); setIsModalOpen(true); }} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all">`
  );
  content = content.replace(
    /<\/h2>\n        <button onClick/g,
    `</h2>\n        <button onClick`
  );
  
  // close the div around buttons
  content = content.replace(
    /Tambah\n        <\/button>\n      <\/div>/,
    `Tambah\n        </button>\n        </div>\n      </div>`
  );

  // Add CsvImportModal component
  const modalComponent = `
      <CsvImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImportSuccess={fetchData} 
        endpoint="${tab.endpoint}" 
        templateHeaders={${JSON.stringify(tab.headers)}} 
        templateFileName="template_${tab.endpoint.replace('/', '_')}.csv" 
      />
    </div>
  );
}`;
  content = content.replace(/    <\/div>\n  \);\n\}$/, modalComponent);

  fs.writeFileSync(filepath, content);
});

console.log("UI Tabs updated with Bulk Import.");
