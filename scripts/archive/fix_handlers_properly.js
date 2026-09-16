const fs = require('fs');
const path = require('path');

const tabs = [
  { file: 'InstrumenEtoserTab.js', endpoint: 'instrumen/etoser', idField: 'id' },
  { file: 'InstrumenFasilTab.js', endpoint: 'instrumen/fasil', idField: 'id' },
  { file: 'InstrumenPeerTab.js', endpoint: 'instrumen/peer', idField: 'id' },
  { file: 'SanksiTab.js', endpoint: 'sanksi', idField: 'id' }
];

tabs.forEach(tab => {
  const filepath = path.join(__dirname, 'src', 'components', 'admin', 'settings', tab.file);
  let content = fs.readFileSync(filepath, 'utf8');

  if (!content.includes('const handleSelectAll')) {
    const handlers = `
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map(d => d.${tab.idField}));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleBulkDelete = async () => {
    if (!confirm("Yakin ingin menghapus " + selectedIds.length + " data terpilih?")) return;
    try {
      const res = await fetch('/api/admin/${tab.endpoint}', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchData();
      } else {
        alert("Gagal menghapus data massal.");
      }
    } catch (e) {
      console.error(e);
    }
  };
`;
    // Find the last occurrence of "return (" which is usually the main component return
    const returnIdx = content.indexOf('  return (\n    <div className="space-y-6">');
    if (returnIdx !== -1) {
      content = content.substring(0, returnIdx) + handlers + '\n' + content.substring(returnIdx);
      fs.writeFileSync(filepath, content);
      console.log("Fixed " + tab.file);
    } else {
      console.log("Could not find return in " + tab.file);
    }
  }
});
