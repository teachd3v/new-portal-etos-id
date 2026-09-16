import fs from 'fs';

const content = `"use client";
import { useState, useEffect } from 'react';
import { Compass, Search, Loader2, ShieldCheck, UserCheck, Users, Zap } from 'lucide-react';

const DIMENSION_ICONS = {
  'Value Resilience': ShieldCheck,
  'Self Resilience': UserCheck,
  'Social Resilience': Users,
  'Change Resilience': Zap,
};

export default function InstrumenReliTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDim, setSelectedDim] = useState('ALL');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/reli/instrumen');
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const dimensions = ['ALL', 'Value Resilience', 'Self Resilience', 'Social Resilience', 'Change Resilience'];

  const filteredItems = items.filter(item => {
    const matchesDim = selectedDim === 'ALL' || item.dimensi === selectedDim;
    const matchesQuery = item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subdimensi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDim && matchesQuery;
  });

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-20">
      
      <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-teal-600" />
            Master 64 Butir Resilient Leaders Index (BAR)
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-0.5">
            Instrumen standar terintegrasi untuk seluruh tahun pembinaan (T0 - T4).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari butir atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {dimensions.map(dim => (
          <button
            key={dim}
            onClick={() => setSelectedDim(dim)}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap \${
              selectedDim === dim
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white/70 text-slate-600 hover:bg-white border border-slate-200/80'
            }\`}
          >
            {dim} {dim !== 'ALL' && \`(\${items.filter(i => i.dimensi === dim).length})\`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 font-black text-xs flex items-center justify-center border border-teal-200">
                  {item.order_num}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {item.kode}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {item.dimensi} &bull; {item.subdimensi}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.judul}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-teal-800 uppercase tracking-wider mb-1">Pernyataan Self (Etoser):</p>
                <p className="text-slate-700 italic">"{item.pernyataan_self}"</p>
              </div>
              <div>
                <p className="font-bold text-indigo-800 uppercase tracking-wider mb-1">Pernyataan Fasilitator:</p>
                <p className="text-slate-700 italic">"{item.pernyataan_fasil}"</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="font-bold text-slate-600 mb-1">Level 1 - Emerging</p>
                <p className="text-slate-700 leading-relaxed">{item.bar_level_1}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="font-bold text-slate-600 mb-1">Level 2 - Developing</p>
                <p className="text-slate-700 leading-relaxed">{item.bar_level_2}</p>
              </div>
              <div className="p-3 bg-teal-50/50 border border-teal-200/60 rounded-xl">
                <p className="font-bold text-teal-800 mb-1">Level 3 - Transformative</p>
                <p className="text-teal-950 leading-relaxed">{item.bar_level_3}</p>
              </div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl">
                <p className="font-bold text-emerald-800 mb-1">Level 4 - Resilient</p>
                <p className="text-emerald-950 leading-relaxed">{item.bar_level_4}</p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
`;

fs.writeFileSync('src/components/admin/settings/InstrumenReliTab.js', content, 'utf8');
console.log('Successfully written InstrumenReliTab.js in UTF8');
