const fs = require('fs');
const path = require('path');

const replaceAlertsAndConfirms = () => {
  // 1. SystemSettingsTab.js
  let sysPath = path.join(__dirname, 'src', 'components', 'admin', 'settings', 'SystemSettingsTab.js');
  let sysContent = fs.readFileSync(sysPath, 'utf8');
  sysContent = sysContent.replace(/if \(res\.ok\) alert\('Pengaturan berhasil disimpan!'\);/g, "if (res.ok) toast.success('Pengaturan berhasil disimpan!');");
  if (!sysContent.includes('toast')) {
    sysContent = "import { toast } from 'react-hot-toast';\n" + sysContent;
  }
  fs.writeFileSync(sysPath, sysContent);

  // 2. Settings Tabs (4 files)
  const tabs = [
    { file: 'InstrumenEtoserTab.js', ep: 'instrumen/etoser' },
    { file: 'InstrumenFasilTab.js', ep: 'instrumen/fasil' },
    { file: 'InstrumenPeerTab.js', ep: 'instrumen/peer' },
    { file: 'SanksiTab.js', ep: 'sanksi' }
  ];
  
  tabs.forEach(tab => {
    let p = path.join(__dirname, 'src', 'components', 'admin', 'settings', tab.file);
    let c = fs.readFileSync(p, 'utf8');
    
    // Replace alert with toast
    c = c.replace(/alert\("Gagal menghapus data massal\."\);/g, "toast.error('Gagal menghapus data massal.');");
    if (!c.includes('react-hot-toast')) {
      c = "import { toast } from 'react-hot-toast';\n" + c;
    }
    if (!c.includes('ConfirmModal')) {
      c = "import ConfirmModal from '../ConfirmModal';\n".replace('../', '../../ui/') + c; // src/components/ui/ConfirmModal
    }
    
    // Add ConfirmModal state
    if (!c.includes('confirmConfig')) {
      c = c.replace(/const \[selectedIds, setSelectedIds\] = useState\(\[\]\);/, `const [selectedIds, setSelectedIds] = useState([]);\n  const [confirmConfig, setConfirmConfig] = useState(null);`);
    }

    // Refactor handleDelete
    const oldHandleDelete = `  const handleDelete = async (id) => {
    if(!confirm("Yakin ingin menghapus?")) return;
    try {
      await fetch(\`/api/admin/${tab.ep}/\${id}\`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };`;
    const newHandleDelete = `  const handleDelete = (id) => {
    setConfirmConfig({
      title: "Hapus Data",
      message: "Yakin ingin menghapus data ini?",
      onConfirm: async () => {
        try {
          await fetch(\`/api/admin/${tab.ep}/\${id}\`, { method: 'DELETE' });
          fetchData();
          toast.success("Berhasil dihapus!");
        } catch (e) {
          toast.error("Gagal menghapus data.");
        }
      }
    });
  };`;
    c = c.replace(oldHandleDelete, newHandleDelete);

    // Refactor handleBulkDelete
    const oldBulkDelete = `  const handleBulkDelete = async () => {
    if (!confirm(\`Yakin ingin menghapus \${selectedIds.length} data terpilih?\`)) return;
    try {
      const res = await fetch('/api/admin/${tab.ep}', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchData();
      } else {
        toast.error('Gagal menghapus data massal.');
      }
    } catch (e) {
      console.error(e);
    }
  };`;
    const newBulkDelete = `  const handleBulkDelete = () => {
    setConfirmConfig({
      title: "Hapus Massal",
      message: \`Yakin ingin menghapus \${selectedIds.length} data terpilih?\`,
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
    c = c.replace(oldBulkDelete, newBulkDelete);

    // Inject ConfirmModal component
    if (!c.includes('<ConfirmModal')) {
      const confirmUi = `
      <ConfirmModal 
        isOpen={!!confirmConfig} 
        onClose={() => setConfirmConfig(null)}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        onConfirm={confirmConfig?.onConfirm}
      />
    </div>
  );`;
      c = c.replace(/    <\/div>\n  \);/, confirmUi);
    }

    fs.writeFileSync(p, c);
  });
  console.log("Settings Tabs updated.");
};

replaceAlertsAndConfirms();
