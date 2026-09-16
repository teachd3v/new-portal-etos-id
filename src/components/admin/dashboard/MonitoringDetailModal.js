"use client";
import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, FileText, User, Calendar, Award } from 'lucide-react';

export default function MonitoringDetailModal({ reportId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!isOpen || !reportId) return;

    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/monitoring/bulanan/detail?reportId=${reportId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setDetail(json.data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [isOpen, reportId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-700 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">
              {detail?.user?.avatar_url ? (
                <img src={detail.user.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                detail?.user?.name ? detail.user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div>
              <h3 className="text-xl font-black">{detail?.user?.name || 'Rincian Monitoring'}</h3>
              <p className="text-xs text-teal-200 font-medium">
                {detail?.user?.id} • Wilayah {detail?.user?.wilayah} • Periode {detail?.report?.period_month} {detail?.report?.period_year}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-teal-600 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Memuat rincian isian instrumen...</p>
            </div>
          ) : detail ? (
            <>
              {/* Meta Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Waktu Submit</span>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {detail.report?.timestamp ? new Date(detail.report.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Butir</span>
                  <p className="text-base font-black text-slate-800 mt-0.5">{detail.answers?.length || 0} Pertanyaan</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Angkatan / Role</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{detail.user?.angkatan || detail.user?.fasil_role || '-'}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                  <span className="text-[11px] font-bold text-teal-700 uppercase">Rata-rata Skor</span>
                  <p className="text-xl font-black text-teal-900 mt-0.5">
                    {detail.answers?.length > 0 
                      ? (detail.answers.reduce((a, b) => a + (b.score || 0), 0) / detail.answers.length).toFixed(2)
                      : '-'
                    }
                  </p>
                </div>
              </div>

              {/* Answers List */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Daftar Pernyataan & Jawaban
                </h4>

                <div className="space-y-3">
                  {detail.answers?.map((ans, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition-colors space-y-3 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {ans.kode}
                            </span>
                            <span className="text-xs font-bold text-teal-700">
                              {ans.variabel} {ans.indikator !== '-' ? `• ${ans.indikator}` : ''}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 leading-relaxed pt-1">
                            {ans.item_pernyataan}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-base shadow-sm">
                            {ans.score}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">Skor (1-4)</span>
                        </div>
                      </div>

                      {/* Validation / Description if exists */}
                      {ans.validation_answer && (
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1">
                          <span className="font-bold text-amber-900 block">
                            Validasi / Keterangan: {ans.pertanyaan_validasi !== '-' ? `(${ans.pertanyaan_validasi})` : ''}
                          </span>
                          <p className="text-slate-700 italic">
                            "{ans.validation_answer}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center py-10 text-slate-500">Data detail tidak ditemukan.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-bold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
