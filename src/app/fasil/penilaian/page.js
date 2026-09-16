"use client";
import { useState, useEffect } from 'react';
import { Users, Compass, Search, Loader2, ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function FasilPenilaianRELIList() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/fasil/penilaian-peer/list');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setActivePeriod(json.activePeriod);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center pt-24">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  const completedCount = data.filter(e => e.isAssessed).length;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-slate-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase text-orange-200 bg-orange-950/60 border border-orange-400/30 px-2.5 md:px-3 py-0.5 md:py-1 rounded-full">
              Evaluator / Fasilitator
            </span>
            <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 mt-2 drop-shadow-sm flex items-center gap-2.5 md:gap-3">
              <Compass className="w-7 h-7 md:w-10 md:h-10 text-orange-200" />
              Asesmen RELI Etoser Binaan
            </h1>
            <p className="text-orange-100/90 font-medium text-xs md:text-lg max-w-xl hidden md:block">
              Evaluasi kematangan kepemimpinan Etoser binaanmu menggunakan 64 butir rubrik instrumen RELI.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-3.5 md:gap-5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <div className="p-2.5 md:p-3.5 bg-orange-500/30 rounded-xl">
              <Users className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-orange-200 font-bold uppercase tracking-wider">Progress Dinilai</p>
              <p className="text-2xl md:text-3xl font-black text-white">{completedCount} <span className="text-sm md:text-lg text-orange-200">/ {data.length}</span></p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-orange-400 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      {!activePeriod ? (
        <div className="bg-white/60 backdrop-blur-md border border-amber-200 p-8 md:p-12 rounded-2xl md:rounded-[2rem] shadow-sm text-center">
          <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-bold text-slate-700">Periode Asesmen RELI Belum Dibuka</h3>
          <p className="text-slate-500 text-xs md:text-sm mt-2">Admin belum membuka periode asesmen RELI. Silakan kembali lagi nanti.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl md:rounded-[2.5rem] shadow-sm p-4 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-6 md:mb-8 border-b border-slate-100 pb-4 md:pb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800">Daftar Binaan</h2>
              <p className="text-slate-500 font-medium text-xs md:text-sm mt-0.5 md:mt-1">
                Periode Aktif: <span className="font-bold text-orange-700">{activePeriod.label || activePeriod.kode_periode}</span>
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari nama atau ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {data
              .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((etoser) => (
              <div key={etoser.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl hover:border-orange-300 hover:shadow-md transition-all gap-4">
                
                <div className="flex items-center gap-3.5 md:gap-4">
                  <div className={`w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-base md:text-xl text-white shadow-sm shrink-0 ${
                    etoser.isAssessed ? 'bg-orange-600' : 'bg-slate-400'
                  }`}>
                    {etoser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-base md:text-lg leading-tight truncate">{etoser.name}</h4>
                    <p className="text-[11px] md:text-xs font-semibold text-slate-500 mt-0.5">
                      {etoser.id} &bull; Angkatan {etoser.angkatan} &bull; {etoser.wilayah || 'Pusat'} &bull; <span className="text-orange-700 font-bold">Fase {etoser.fase || 'T0'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 md:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  {/* Self status badge */}
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400">Self Assessment</p>
                    {etoser.hasSelfAssessed ? (
                      <span className="text-[11px] md:text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5" /> Terisi
                      </span>
                    ) : (
                      <span className="text-[11px] md:text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 md:w-3.5 h-3 md:h-3.5" /> Belum
                      </span>
                    )}
                  </div>

                  {/* Final Score & Gap if evaluated */}
                  {etoser.finalReli !== null && (
                    <div className="text-left border-l border-slate-200 pl-3 md:pl-4">
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400">RELI & Gap</p>
                      <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                        <span className="font-black text-orange-800 text-xs md:text-sm">{etoser.finalReli.toFixed(2)}</span>
                        {etoser.gapCategory && (
                          <span className={`text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-bold ${
                            etoser.gapCategory === 'Selaras' ? 'bg-emerald-100 text-emerald-700' :
                            etoser.gapCategory === 'Perlu refleksi' ? 'bg-sky-100 text-sky-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {etoser.gapCategory}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <div className="w-full sm:w-auto">
                    {etoser.isAssessed ? (
                      <Link 
                        href={`/fasil/penilaian/${etoser.id}`}
                        className="w-full sm:w-auto text-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-colors inline-flex"
                      >
                        Edit Penilaian
                        <ArrowRight className="w-3.5 md:w-4 h-3.5 md:h-4" />
                      </Link>
                    ) : (
                      <Link 
                        href={`/fasil/penilaian/${etoser.id}`} 
                        className="w-full sm:w-auto text-center justify-center bg-orange-600 hover:bg-orange-700 text-white px-5 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition-all shadow-md shadow-orange-600/20 active:scale-95 inline-flex"
                      >
                        Mulai Nilai
                        <ArrowRight className="w-3.5 md:w-4 h-3.5 md:h-4" />
                      </Link>
                    )}
                  </div>
                </div>

              </div>
            ))}


            {data.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">
                Belum ada data Etoser binaan di akun Anda.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

