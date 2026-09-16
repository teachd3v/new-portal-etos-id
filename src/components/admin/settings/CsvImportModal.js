import { useState, useEffect } from 'react';
import { X, Upload, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CsvImportModal({ isOpen, onClose, onImportSuccess, endpoint, templateHeaders, templateFileName }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmUpsertData, setConfirmUpsertData] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + templateHeaders.join(',') + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", templateFileName || "template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        try {
          const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);
          if (rows.length < 2) throw new Error("File CSV kosong atau tidak memiliki data.");
          
          const headers = rows[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
          const data = rows.slice(1).map(row => {
            // Split by comma but ignore commas inside double quotes
            const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index];
            });
            return obj;
          });
          setPreview(data);
        } catch (err) {
          setError(err.message);
          setPreview([]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async (forceUpsert = false) => {
    if (preview.length === 0) return;
    setLoading(true);
    try {
      if (forceUpsert !== true) {
        // Pre-flight check
        const checkRes = await fetch(`/api/admin/${endpoint}?check_only=true`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preview)
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.existingCount && checkData.existingCount > 0) {
            setConfirmUpsertData({ existingCount: checkData.existingCount });
            setLoading(false);
            return;
          }
        }
      }

      // Proceed to actual upsert
      const res = await fetch(`/api/admin/${endpoint}?upsert=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview)
      });
      
      if (res.ok) {
        onImportSuccess();
        onClose();
        setFile(null);
        setPreview([]);
        setConfirmUpsertData(null);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal mengimpor data.");
      }
    } catch (e) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 md:pl-28 bg-teal-950/20 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-8 w-full max-w-[90vw] md:max-w-6xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col cursor-default">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-2xl font-bold text-teal-950">Bulk Import Data</h3>
          <button onClick={onClose} className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors text-teal-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Action Bar */}
          <div className="flex justify-between items-center bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
            <div>
              <h4 className="font-bold text-teal-900">1. Unduh Template</h4>
              <p className="text-sm text-teal-700 mt-1">Gunakan template CSV ini agar format kolom sesuai dengan sistem.</p>
            </div>
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 font-semibold py-2 px-4 rounded-xl shadow-sm transition-all">
              <Download className="w-4 h-4" /> Unduh Template
            </button>
          </div>

          <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
            <h4 className="font-bold text-teal-900 mb-2">2. Unggah File CSV</h4>
            <div className="border-2 border-dashed border-teal-200 bg-white rounded-xl p-8 text-center hover:border-teal-400 transition-colors cursor-pointer relative">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                  {file ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>
                <div className="text-teal-900 font-medium">
                  {file ? file.name : "Klik atau seret file CSV ke sini"}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-teal-900">Pratinjau Data</h4>
                <span className="text-xs font-bold bg-teal-100 text-teal-800 px-3 py-1 rounded-full">{preview.length} baris</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-teal-100 bg-white max-h-60 overflow-y-auto shadow-inner">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-teal-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-teal-800 border-b border-teal-100 w-12">No</th>
                      {templateHeaders.map((header, i) => (
                        <th key={i} className="px-4 py-3 font-semibold text-teal-800 border-b border-teal-100">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50">
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-teal-50/50">
                        <td className="px-4 py-2 text-teal-900/50">{i + 1}</td>
                        {templateHeaders.map((header, j) => (
                          <td key={j} className="px-4 py-2 text-teal-900">{row[header] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div className="p-3 text-center text-xs font-bold text-teal-600 bg-teal-50/30 border-t border-teal-50">
                    Menampilkan 10 baris pertama...
                  </div>
                )}
              </div>
            </div>
          )}

          {confirmUpsertData && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-4 animate-in fade-in zoom-in duration-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 mb-1">Perhatian!</h4>
                  <p className="text-amber-800 text-sm mb-4">
                    Terdapat <strong>{confirmUpsertData.existingCount} data</strong> yang memiliki ID yang sudah terdaftar di sistem.
                    Apakah Anda ingin menimpa (upsert) data tersebut dengan data baru dari file CSV ini?
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setConfirmUpsertData(null)} 
                      className="px-4 py-2 bg-white border border-amber-200 text-amber-900 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors shadow-sm"
                    >
                      Batal Import
                    </button>
                    <button 
                      onClick={() => handleImport(true)} 
                      className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors shadow-md"
                    >
                      Ya, Timpa Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-teal-100 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 text-teal-700 font-semibold hover:bg-teal-50 rounded-xl transition-colors">Tutup</button>
          {!confirmUpsertData && (
            <button 
              onClick={() => handleImport(false)} 
              disabled={preview.length === 0 || loading} 
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              Mulai Import ({preview.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
