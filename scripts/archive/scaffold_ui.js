const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components', 'admin', 'settings');
const pageDir = path.join(__dirname, 'src', 'app', 'admin', 'settings');

function createDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

createDir(componentsDir);
createDir(pageDir);

const generateTableTab = (name, endpoint, columns) => `
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';

export default function ${name}Tab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/${endpoint}');
      setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!formData.id;
    const url = isEdit ? \`/api/admin/${endpoint}/\${formData.id}\` : '/api/admin/${endpoint}';
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Yakin ingin menghapus?")) return;
    try {
      await fetch(\`/api/admin/${endpoint}/\${id}\`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-teal-950">Master ${name.replace('Instrumen', 'Instrumen ')}</h2>
        <button onClick={() => { setFormData({}); setIsModalOpen(true); }} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-teal-900/5 text-teal-800 text-sm">
            <tr>
              ${columns.map(c => `<th className="p-4 font-semibold">${c.label}</th>`).join('\n              ')}
              <th className="p-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-900/5">
            {loading ? <tr><td colSpan="10" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" /></td></tr> : data.map((row, i) => (
              <tr key={i} className="hover:bg-white/40">
                ${columns.map(c => `<td className="p-4 text-sm text-teal-900">{row.${c.key}}</td>`).join('\n                ')}
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setFormData(row); setIsModalOpen(true); }} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(row.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/20 backdrop-blur-sm p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-teal-950">{formData.id ? 'Edit' : 'Tambah'} ${name}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-teal-900" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              ${columns.map(c => `
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">${c.label}</label>
                <input type="text" required value={formData.${c.key} || ''} onChange={e => setFormData({...formData, ${c.key}: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>`).join('')}
              <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">Simpan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

const generateSystemSettingsTab = () => `
import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';

export default function SystemSettingsTab() {
  const [settings, setSettings] = useState({
    'periode_etoser_start': '25', 'periode_etoser_end': '3',
    'periode_fasil_start': '25', 'periode_fasil_end': '7',
    'periode_peer_start': '25', 'periode_peer_end': '7',
    'bobot_fasil': '70', 'bobot_etoser': '30'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      const s = { ...settings };
      data.forEach(item => { s[item.key] = item.value; });
      setSettings(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = Object.entries(settings).map(([key, value]) => ({ key, value }));
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) alert('Pengaturan berhasil disimpan!');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-6 space-y-6">
        <h3 className="text-lg font-bold text-teal-950 border-b border-teal-900/10 pb-2">Periode Evaluasi Bulanan</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-semibold text-teal-900 text-sm">Penilaian Mandiri Etoser</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-teal-700">Tgl Mulai:</span>
              <input type="number" value={settings.periode_etoser_start} onChange={e => setSettings({...settings, periode_etoser_start: e.target.value})} className="w-20 px-3 py-2 rounded-xl bg-white/50 border border-teal-100" />
              <span className="text-sm text-teal-700">Tgl Selesai:</span>
              <input type="number" value={settings.periode_etoser_end} onChange={e => setSettings({...settings, periode_etoser_end: e.target.value})} className="w-20 px-3 py-2 rounded-xl bg-white/50 border border-teal-100" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-teal-900 text-sm">Penilaian Mandiri Fasil</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-teal-700">Tgl Mulai:</span>
              <input type="number" value={settings.periode_fasil_start} onChange={e => setSettings({...settings, periode_fasil_start: e.target.value})} className="w-20 px-3 py-2 rounded-xl bg-white/50 border border-teal-100" />
              <span className="text-sm text-teal-700">Tgl Selesai:</span>
              <input type="number" value={settings.periode_fasil_end} onChange={e => setSettings({...settings, periode_fasil_end: e.target.value})} className="w-20 px-3 py-2 rounded-xl bg-white/50 border border-teal-100" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-teal-900 text-sm">Fasil menilai Etoser (Peer)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-teal-700">Tgl Mulai:</span>
              <input type="number" value={settings.periode_peer_start} onChange={e => setSettings({...settings, periode_peer_start: e.target.value})} className="w-20 px-3 py-2 rounded-xl bg-white/50 border border-teal-100" />
              <span className="text-sm text-teal-700">Tgl Selesai:</span>
              <input type="number" value={settings.periode_peer_end} onChange={e => setSettings({...settings, periode_peer_end: e.target.value})} className="w-20 px-3 py-2 rounded-xl bg-white/50 border border-teal-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-6 space-y-6">
        <h3 className="text-lg font-bold text-teal-950 border-b border-teal-900/10 pb-2">Bobot Nilai Akhir (IPK Pembinaan)</h3>
        <div className="flex items-center gap-6">
          <div>
            <label className="block text-sm font-semibold text-teal-900 mb-1">Bobot Penilaian Fasil (%)</label>
            <input type="number" value={settings.bobot_fasil} onChange={e => setSettings({...settings, bobot_fasil: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-teal-900 mb-1">Bobot Penilaian Etoser (%)</label>
            <input type="number" value={settings.bobot_etoser} onChange={e => setSettings({...settings, bobot_etoser: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-white/50 border border-teal-100" />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Simpan Konfigurasi
      </button>
    </div>
  );
}
`;

const generatePage = () => `
"use client";
import { useState } from 'react';
import SystemSettingsTab from '@/components/admin/settings/SystemSettingsTab';
import InstrumenEtoserTab from '@/components/admin/settings/InstrumenEtoserTab';
import InstrumenFasilTab from '@/components/admin/settings/InstrumenFasilTab';
import InstrumenPeerTab from '@/components/admin/settings/InstrumenPeerTab';
import SanksiTab from '@/components/admin/settings/SanksiTab';
import { Settings, CheckSquare, Users, UserCheck, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('system');

  const tabs = [
    { id: 'system', label: 'Sistem', icon: Settings, component: SystemSettingsTab },
    { id: 'etoser', label: 'Instrumen Etoser', icon: CheckSquare, component: InstrumenEtoserTab },
    { id: 'fasil', label: 'Instrumen Fasil', icon: Users, component: InstrumenFasilTab },
    { id: 'peer', label: 'Instrumen Peer', icon: UserCheck, component: InstrumenPeerTab },
    { id: 'sanksi', label: 'Katalog Sanksi', icon: AlertTriangle, component: SanksiTab },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || SystemSettingsTab;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="pt-4">
        <h1 className="text-4xl font-black text-teal-950 tracking-tight">Pengaturan & Monev</h1>
        <p className="text-teal-800/70 font-medium text-lg">Kelola instrumen penilaian, periode, dan sanksi pembinaan.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all \${
                isActive 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'bg-white/50 text-teal-800 hover:bg-white border border-teal-100'
              }\`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content Area */}
      <div className="pt-2">
        <ActiveComponent />
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(componentsDir, 'SystemSettingsTab.js'), generateSystemSettingsTab());

fs.writeFileSync(path.join(componentsDir, 'InstrumenEtoserTab.js'), generateTableTab('InstrumenEtoser', 'instrumen/etoser', [
  { key: 'tahun_pembinaan', label: 'Thn' },
  { key: 'variabel', label: 'Variabel' },
  { key: 'kode', label: 'Kode' },
  { key: 'jenis_skala', label: 'Skala' },
  { key: 'indikator', label: 'Indikator' },
  { key: 'item_pernyataan', label: 'Pernyataan' }
]));

fs.writeFileSync(path.join(componentsDir, 'InstrumenFasilTab.js'), generateTableTab('InstrumenFasil', 'instrumen/fasil', [
  { key: 'role', label: 'Role' },
  { key: 'kode', label: 'Kode' },
  { key: 'jenis_skala', label: 'Skala' },
  { key: 'item_pernyataan', label: 'Pernyataan' }
]));

fs.writeFileSync(path.join(componentsDir, 'InstrumenPeerTab.js'), generateTableTab('InstrumenPeer', 'instrumen/peer', [
  { key: 'indikator', label: 'Indikator' },
  { key: 'kode', label: 'Kode' },
  { key: 'jenis_skala', label: 'Skala' },
  { key: 'item_pernyataan', label: 'Pernyataan' }
]));

fs.writeFileSync(path.join(componentsDir, 'SanksiTab.js'), generateTableTab('Sanksi', 'sanksi', [
  { key: 'kategori', label: 'Kategori' },
  { key: 'detail_pelanggaran', label: 'Pelanggaran' },
  { key: 'masa_perbaikan', label: 'Masa Perbaikan' },
  { key: 'poin', label: 'Poin' },
  { key: 'credit_perform', label: 'Credit Perform' }
]));

fs.writeFileSync(path.join(pageDir, 'page.js'), generatePage());

console.log("UI Scaffolded.");
