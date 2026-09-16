const fs = require('fs');
const path = require('path');

const tabs = [
  'InstrumenEtoserTab.js',
  'InstrumenFasilTab.js',
  'InstrumenPeerTab.js',
  'SanksiTab.js'
];

tabs.forEach(tab => {
  const filepath = path.join(__dirname, 'src', 'components', 'admin', 'settings', tab);
  let content = fs.readFileSync(filepath, 'utf8');

  if (!content.includes('Hapus Terpilih')) {
    const buttonHtml = `
        {selectedIds.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Trash2 className="w-5 h-5" /> Hapus Terpilih ({selectedIds.length})
          </button>
        )}`;

    // Try finding flex gap-3
    content = content.replace(/<div className="flex gap-3">\\s*<button onClick=\\{\\(\\) => setIsImportOpen\\(true\\)\\}/, '<div className="flex gap-3">' + buttonHtml + '\\n        <button onClick={() => setIsImportOpen(true)}');
    
    // Also try flex gap-2 just in case
    content = content.replace(/<div className="flex gap-2">\\s*<button onClick=\\{\\(\\) => setIsImportOpen\\(true\\)\\}/, '<div className="flex gap-2">' + buttonHtml + '\\n        <button onClick={() => setIsImportOpen(true)}');

    fs.writeFileSync(filepath, content);
  }
});

console.log("Buttons injected.");
