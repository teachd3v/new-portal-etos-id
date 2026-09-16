const fs = require('fs');
const path = require('path');

const replaceUsersAndAgendas = () => {
  // users/page.js
  let usersPath = path.join(__dirname, 'src', 'app', 'admin', 'users', 'page.js');
  let usersContent = fs.readFileSync(usersPath, 'utf8');
  
  if (!usersContent.includes('react-hot-toast')) {
    usersContent = "import { toast } from 'react-hot-toast';\n" + usersContent;
  }
  if (!usersContent.includes('ConfirmModal')) {
    usersContent = "import ConfirmModal from '@/components/ui/ConfirmModal';\n" + usersContent;
  }
  
  usersContent = usersContent.replace(/alert\("Gagal menghapus data massal\."\);/g, "toast.error('Gagal menghapus data massal.');");
  usersContent = usersContent.replace(/alert\(data\.error \|\| "Gagal upload data"\);/g, "toast.error(data.error || 'Gagal upload data');");
  usersContent = usersContent.replace(/alert\("Terjadi kesalahan saat upload\."\);/g, "toast.error('Terjadi kesalahan saat upload.');");

  // Fix handleBulkDelete in users/page.js
  if (!usersContent.includes('confirmConfig')) {
    usersContent = usersContent.replace(/const \[selectedIds, setSelectedIds\] = useState\(\[\]\);/, `const [selectedIds, setSelectedIds] = useState([]);\n  const [confirmConfig, setConfirmConfig] = useState(null);`);
  }
  const oldUsersBulkDelete = `  const handleBulkDelete = async () => {
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
        toast.error('Gagal menghapus data massal.');
      }
    } catch (e) {
      console.error(e);
    }
  };`;
  const newUsersBulkDelete = `  const handleBulkDelete = () => {
    setConfirmConfig({
      title: "Hapus Massal",
      message: \`Yakin ingin menghapus \${selectedIds.length} data terpilih?\`,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
          if (res.ok) {
            setSelectedIds([]);
            fetchUsers();
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
  usersContent = usersContent.replace(oldUsersBulkDelete, newUsersBulkDelete);
  
  if (!usersContent.includes('<ConfirmModal')) {
    const confirmUi = `
      <ConfirmModal 
        isOpen={!!confirmConfig} 
        onClose={() => setConfirmConfig(null)}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        onConfirm={confirmConfig?.onConfirm}
      />
    </div>
  );
}`;
    usersContent = usersContent.replace(/    <\/div>\n  \);\n\}/g, confirmUi);
  }
  
  fs.writeFileSync(usersPath, usersContent);

  // agendas/page.js
  let agendasPath = path.join(__dirname, 'src', 'app', 'admin', 'agendas', 'page.js');
  let agendasContent = fs.readFileSync(agendasPath, 'utf8');
  if (!agendasContent.includes('react-hot-toast')) {
    agendasContent = "import { toast } from 'react-hot-toast';\n" + agendasContent;
  }
  agendasContent = agendasContent.replace(/alert\(err\.error \|\| "Gagal membuat agenda"\);/g, "toast.error(err.error || 'Gagal membuat agenda');");
  fs.writeFileSync(agendasPath, agendasContent);
  
  console.log("Users and Agendas updated.");
};

replaceUsersAndAgendas();
