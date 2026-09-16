"use client";
import { useState, useEffect } from "react";
import { Download, Search, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function DaftarSanksiPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Simulate fetching data for sanksi (mocking since no direct DB table for user_sanksi yet)
    setTimeout(() => {
      const mockData = [
        { id: "E2024001", name: "Budi Santoso", wilayah: "Bogor", angkatan: "2024", poin: 15, keterangan: "SP 1", pelanggaran: "Tidak hadir pembinaan 3x berturut-turut tanpa izin." },
        { id: "E2023055", name: "Siti Aminah", wilayah: "Padang", angkatan: "2023", poin: 35, keterangan: "SP 2", pelanggaran: "Pemalsuan dokumen laporan bulanan." },
        { id: "E2024102", name: "Andi Wijaya", wilayah: "Aceh", angkatan: "2024", poin: 10, keterangan: "Teguran", pelanggaran: "Terlambat kumpul tugas > 3 kali." }
      ];
      setData(mockData);
      setLoading(false);
    }, 800);
  }, []);

  const handleExportCSV = () => {
    if (data.length === 0) return toast.error("Tidak ada data untuk diekspor");
    
    const headers = ["ID", "Nama", "Wilayah", "Angkatan", "Poin", "Keterangan", "Daftar Pelanggaran"];
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    data.forEach(row => {
      const values = [
        row.id,
        '"' + row.name + '"',
        '"' + row.wilayah + '"',
        row.angkatan,
        row.poin,
        '"' + row.keterangan + '"',
        '"' + row.pelanggaran + '"'
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "daftar_penerima_sanksi.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Berhasil mengekspor data ke CSV");
  };

  const filteredData = data.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-8 pb-24 md:pb-12">
      
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-teal-950 tracking-tight">Daftar Penerima Sanksi</h1>
          <p className="text-teal-800/70 font-medium text-xs md:text-sm mt-0.5">Monitoring Etoser yang mendapatkan sanksi disipliner.</p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold shadow-md shadow-teal-900/15 hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs md:text-sm w-full sm:w-auto cursor-pointer"
        >
          <Download className="w-4 h-4 md:w-5 md:h-5" /> Export CSV
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-teal-600/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama atau ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-white/50 border border-teal-100 rounded-xl md:rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-900 font-medium"
            />
          </div>
        </div>

        {/* Mobile Card List View (< md) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="p-8 text-center text-teal-600 bg-white/50 rounded-xl border border-teal-100">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-teal-800">Memuat data sanksi...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-8 text-center text-teal-800/60 font-medium bg-white/50 rounded-xl border border-teal-100 text-xs">
              Tidak ada data sanksi yang ditemukan.
            </div>
          ) : (
            filteredData.map((row, i) => (
              <div key={i} className="bg-white/90 border border-teal-100 rounded-xl p-4 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-teal-950 text-sm leading-snug">{row.name}</h4>
                    <p className="text-[11px] text-teal-600 font-mono mt-0.5">{row.id} &bull; {row.wilayah} ({row.angkatan})</p>
                  </div>
                  <span className={"inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm shrink-0 " + (row.poin > 20 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}>
                    {row.poin}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border " + (row.poin > 20 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
                    <AlertCircle className="w-3 h-3" /> {row.keterangan}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">Poin Pelanggaran: {row.poin}</span>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-900 block text-[11px] mb-0.5">Daftar Pelanggaran:</span>
                  {row.pelanggaran}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-teal-50">
          <table className="w-full text-left border-collapse">
            <thead className="bg-teal-900/5 text-teal-800 text-sm">
              <tr>
                <th className="p-5 font-semibold">Nama & ID</th>
                <th className="p-5 font-semibold">Wilayah/Angkatan</th>
                <th className="p-5 font-semibold text-center">Poin</th>
                <th className="p-5 font-semibold">Keterangan</th>
                <th className="p-5 font-semibold">Daftar Pelanggaran</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-12 text-center text-teal-600"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></td></tr>
              ) : filteredData.map((row, i) => (
                <tr key={i} className="border-b border-teal-50 hover:bg-white/50 transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-teal-950 text-base">{row.name}</div>
                    <div className="text-xs text-teal-600 font-mono mt-0.5">{row.id}</div>
                  </td>
                  <td className="p-5 text-sm text-teal-800 font-medium">
                    {row.wilayah} <span className="text-teal-400 mx-1">•</span> {row.angkatan}
                  </td>
                  <td className="p-5 text-center">
                    <span className={"inline-flex items-center justify-center w-10 h-10 rounded-full font-black text-lg " + (row.poin > 20 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}>
                      {row.poin}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border " + (row.poin > 20 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
                      <AlertCircle className="w-3.5 h-3.5" /> {row.keterangan}
                    </div>
                  </td>
                  <td className="p-5 text-sm text-teal-800 leading-relaxed max-w-md">
                    {row.pelanggaran}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && !loading && (
                <tr><td colSpan="5" className="p-12 text-center text-teal-600 font-medium">Tidak ada data sanksi yang ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
