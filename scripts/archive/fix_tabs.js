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
  
  // 1. Change Import CSV icon and label
  content = content.replace(/import \{ (.*?)Upload(.*?) \} from 'lucide-react';/, "import { $1UploadCloud$2 } from 'lucide-react';");
  
  const oldButton = /<button onClick=\{\(\) => setIsImportOpen\(true\)\} className="bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-sm transition-all">\s*<Upload className="w-4 h-4" \/> Import CSV\s*<\/button>/;
  
  const newButton = `<button onClick={() => setIsImportOpen(true)} className="flex items-center gap-2 bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all active:scale-95">\n          <UploadCloud className="w-5 h-5" /> Bulk Import CSV\n        </button>`;
  
  content = content.replace(oldButton, newButton);

  // 2. Add CsvImportModal if missing
  if (!content.includes('<CsvImportModal')) {
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
    // Find the last closing tag
    content = content.replace(/    <\/div>\s*\);\s*\}\s*$/, modalComponent);
  }

  fs.writeFileSync(filepath, content);
});

console.log("Fixed missing CsvImportModal and updated button styling.");
