const fs = require('fs');
const path = require('path');

const updateUsersPage = () => {
  const filepath = path.join(__dirname, 'src', 'app', 'admin', 'users', 'page.js');
  let content = fs.readFileSync(filepath, 'utf8');

  // 1. Add state
  if (!content.includes('selectedIds')) {
    content = content.replace(
      /const \[selectedUser, setSelectedUser\] = useState\(null\);/,
      `const [selectedUser, setSelectedUser] = useState(null);\n  const [selectedIds, setSelectedIds] = useState([]);`
    );
  }

  // 2. Add handlers
  if (!content.includes('handleSelectAll')) {
    const handlers = `
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleBulkDelete = async () => {
    if (!confirm(\`Yakin ingin menghapus \${selectedIds.length} data terpilih?\`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchUsers();
      } else {
        alert("Gagal menghapus data massal.");
      }
    } catch (e) {
      console.error(e);
    }
  };
`;
    content = content.replace(/const fetchUsers = async/, handlers + '\n  const fetchUsers = async');
  }

  // 3. Add button
  if (!content.includes('Hapus Terpilih')) {
    const button = `
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Trash2 className="w-5 h-5" /> Hapus Terpilih ({selectedIds.length})
            </button>
          )}`;
    content = content.replace(/<div className="flex gap-3">\s*<button\s*onClick=\{\(\) => setIsBulkModalOpen\(true\)\}/, `<div className="flex gap-3">\n${button}\n          <button \n            onClick={() => setIsBulkModalOpen(true)}`);
  }

  // 4. Table Header
  if (!content.includes('onChange={handleSelectAll}')) {
    content = content.replace(
      /<th className="px-4 py-3 text-left text-sm font-semibold text-teal-800">ID<\/th>/,
      `<th className="px-4 py-3 w-10 text-center"><input type="checkbox" onChange={handleSelectAll} checked={paginatedUsers.length > 0 && selectedIds.length === paginatedUsers.length} className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" /></th>\n                      <th className="px-4 py-3 text-left text-sm font-semibold text-teal-800">ID</th>`
    );
  }

  // 5. Table Row
  if (!content.includes('onChange={(e) => handleSelectOne(user.id')) {
    content = content.replace(
      /<td className="px-4 py-3">\s*<div className="flex items-center gap-3">/,
      `<td className="px-4 py-3 text-center"><input type="checkbox" onChange={(e) => handleSelectOne(user.id, e.target.checked)} checked={selectedIds.includes(user.id)} className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" /></td>\n                        <td className="px-4 py-3">\n                          <div className="flex items-center gap-3">`
    );
  }

  fs.writeFileSync(filepath, content);
};

const updateSettingsTab = (filename, endpoint, idField = 'id') => {
  const filepath = path.join(__dirname, 'src', 'components', 'admin', 'settings', filename);
  let content = fs.readFileSync(filepath, 'utf8');

  // Add Trash2 to imports if missing
  if (!content.includes('Trash2')) {
    content = content.replace(/import \{ (.*?) \} from 'lucide-react';/, "import { $1, Trash2 } from 'lucide-react';");
  }

  // 1. Add state
  if (!content.includes('selectedIds')) {
    content = content.replace(
      /const \[isImportOpen, setIsImportOpen\] = useState\(false\);/,
      `const [isImportOpen, setIsImportOpen] = useState(false);\n  const [selectedIds, setSelectedIds] = useState([]);`
    );
  }

  // 2. Add handlers
  if (!content.includes('handleSelectAll')) {
    const handlers = `
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map(d => d.${idField}));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleBulkDelete = async () => {
    if (!confirm(\`Yakin ingin menghapus \${selectedIds.length} data terpilih?\`)) return;
    try {
      const res = await fetch('/api/admin/${endpoint}', {
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
    content = content.replace(/const handleAdd = async/, handlers + '\n  const handleAdd = async');
  }

  // 3. Add button
  if (!content.includes('Hapus Terpilih')) {
    const button = `
        {selectedIds.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Trash2 className="w-5 h-5" /> Hapus Terpilih ({selectedIds.length})
          </button>
        )}`;
    content = content.replace(/<div className="flex gap-2">\s*<button onClick=\{\(\) => setIsImportOpen\(true\)\}/, `<div className="flex gap-2">\n${button}\n        <button onClick={() => setIsImportOpen(true)}`);
  }

  // 4. Table Header (Find first <th> and insert before it)
  if (!content.includes('onChange={handleSelectAll}')) {
    content = content.replace(
      /<th className="p-4 font-semibold">/,
      `<th className="p-4 font-semibold w-10 text-center"><input type="checkbox" onChange={handleSelectAll} checked={data.length > 0 && selectedIds.length === data.length} className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" /></th>\n              <th className="p-4 font-semibold">`
    );
  }

  // 5. Table Row (Find first <td> and insert before it)
  if (!content.includes(`onChange={(e) => handleSelectOne(row.${idField}`)) {
    content = content.replace(
      /<td className="p-4 text-sm font-semibold text-teal-950">/,
      `<td className="p-4 text-center"><input type="checkbox" onChange={(e) => handleSelectOne(row.${idField}, e.target.checked)} checked={selectedIds.includes(row.${idField})} className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" /></td>\n                <td className="p-4 text-sm font-semibold text-teal-950">`
    );
    // If the first td has a different class:
    if (!content.includes('handleSelectOne')) {
        content = content.replace(
            /<td className="p-4 text-sm text-teal-900">/,
            `<td className="p-4 text-center"><input type="checkbox" onChange={(e) => handleSelectOne(row.${idField}, e.target.checked)} checked={selectedIds.includes(row.${idField})} className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" /></td>\n                <td className="p-4 text-sm text-teal-900">`
        );
    }
  }

  fs.writeFileSync(filepath, content);
};

updateUsersPage();
updateSettingsTab('InstrumenEtoserTab.js', 'instrumen/etoser');
updateSettingsTab('InstrumenFasilTab.js', 'instrumen/fasil');
updateSettingsTab('InstrumenPeerTab.js', 'instrumen/peer');
updateSettingsTab('SanksiTab.js', 'sanksi');

console.log("UI updated for Bulk Delete.");
