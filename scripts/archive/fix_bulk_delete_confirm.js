const fs = require('fs');
const path = require('path');

const tabs = [
  { file: 'InstrumenEtoserTab.js', ep: 'instrumen/etoser' },
  { file: 'InstrumenFasilTab.js', ep: 'instrumen/fasil' },
  { file: 'InstrumenPeerTab.js', ep: 'instrumen/peer' },
  { file: 'SanksiTab.js', ep: 'sanksi' }
];

tabs.forEach(tab => {
  const filepath = path.join(__dirname, 'src', 'components', 'admin', 'settings', tab.file);
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace handleBulkDelete entirely
  const oldFuncRegex = /const handleBulkDelete = async \(\) => \{[\s\S]*?catch \(e\) \{\s*console\.error\(e\);\s*\}\s*\};/;
  
  const newBulkDelete = `const handleBulkDelete = () => {
    setConfirmConfig({
      title: "Hapus Massal",
      message: "Yakin ingin menghapus " + selectedIds.length + " data terpilih?",
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/${tab.ep}', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
          if (res.ok) {
            setSelectedIds([]);
            fetchData();
            toast.success("Berhasil menghapus data massal!");
          } else {
            toast.error('Gagal menghapus data massal.');
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };`;

  if (oldFuncRegex.test(content) && content.includes('!confirm("Yakin ingin menghapus " + selectedIds.length')) {
    content = content.replace(oldFuncRegex, newBulkDelete);
    fs.writeFileSync(filepath, content);
    console.log("Updated " + tab.file);
  }
});
