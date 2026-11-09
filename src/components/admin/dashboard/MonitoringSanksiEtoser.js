"use client";
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Download,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Users,
  Calendar,
  Trash2,
  Plus,
  X,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Check
} from 'lucide-react';
import StatCard from './StatCard';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';

const MONTH_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEAR_OPTIONS = ['2024', '2025', '2026', '2027'];

function formatDateID(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTimeID(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toYYYYMMDD(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function MonitoringSanksiEtoser() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [bulan, setBulan] = useState(MONTH_OPTIONS[now.getMonth()]);
  const [tahun, setTahun] = useState(now.getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [wilayah, setWilayah] = useState('all');
  const [angkatan, setAngkatan] = useState('all');
  const [kategori, setKategori] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('rekap'); // 'rekap' (per Etoser for Finance) | 'rincian' (per violation)

  // Add Sanksi Modal (Admin)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formUserId, setFormUserId] = useState('');
  const [formKategori, setFormKategori] = useState('');
  const [formKatalogId, setFormKatalogId] = useState('');
  const [formBulan, setFormBulan] = useState(MONTH_OPTIONS[now.getMonth()]);
  const [formTahun, setFormTahun] = useState(now.getFullYear().toString());
  const [formKeterangan, setFormKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  // Export CSV Modal (Date Range & Format)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportMode, setExportMode] = useState('rekap'); // 'rekap' | 'rincian'
  const [exportStatusFilter, setExportStatusFilter] = useState('all'); // 'all' | 'APPROVED'
  const [exporting, setExporting] = useState(false);

  // Confirm Delete / Bulk Modal
  const [confirmConfig, setConfirmConfig] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        bulan,
        tahun,
        wilayah,
        angkatan,
        kategori,
        status: statusFilter
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/admin/monitoring/sanksi?${qs}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Gagal memuat daftar sanksi Etoser");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun, startDate, endDate, wilayah, angkatan, kategori, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const katalogSanksi = data?.katalogSanksi || [];
  const kategoriOptions = [...new Set(katalogSanksi.map(k => k.kategori).filter(Boolean))];
  const filteredModalKatalog = formKategori
    ? katalogSanksi.filter(k => k.kategori === formKategori)
    : katalogSanksi;
  const chosenCatalogItem = katalogSanksi.find(k => k.id === formKatalogId) || null;

  const filteredSummary = (data?.summaryByEtoser || []).filter(row =>
    row.etoserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.etoserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.pelanggaranRingkas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCases = (data?.cases || []).filter(row =>
    row.etoserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.etoserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.detailPelanggaran.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCasesInView = (data?.cases || []).filter(c => c.status === 'PENDING');

  const openAddModalForEtoser = (etoserId = '', targetMonth = '', targetYear = '') => {
    setFormUserId(etoserId || '');
    setFormBulan(targetMonth || (bulan === 'all' ? MONTH_OPTIONS[now.getMonth()] : bulan));
    setFormTahun(targetYear || (tahun === 'all' ? now.getFullYear().toString() : tahun));
    setFormKategori('');
    setFormKatalogId('');
    setFormKeterangan('');
    setIsAddModalOpen(true);
  };

  const openExportModal = () => {
    setExportStartDate(startDate || '');
    setExportEndDate(endDate || '');
    setExportMode(viewMode);
    setExportStatusFilter(statusFilter === 'APPROVED' ? 'APPROVED' : 'all');
    setIsExportModalOpen(true);
  };

  const applyExportDatePreset = (preset) => {
    const today = new Date();
    if (preset === 'all') {
      setExportStartDate('');
      setExportEndDate('');
    } else if (preset === 'today') {
      const str = toYYYYMMDD(today);
      setExportStartDate(str);
      setExportEndDate(str);
    } else if (preset === '7d') {
      const past = new Date(today);
      past.setDate(today.getDate() - 6);
      setExportStartDate(toYYYYMMDD(past));
      setExportEndDate(toYYYYMMDD(today));
    } else if (preset === '30d') {
      const past = new Date(today);
      past.setDate(today.getDate() - 29);
      setExportStartDate(toYYYYMMDD(past));
      setExportEndDate(toYYYYMMDD(today));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setExportStartDate(toYYYYMMDD(firstDay));
      setExportEndDate(toYYYYMMDD(lastDay));
    }
  };

  const handleVerifyCase = async (id, newStatus) => {
    setVerifyingId(id);
    try {
      const res = await fetch('/api/admin/monitoring/sanksi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message);
        fetchData();
      } else {
        toast.error(json.error || "Gagal memperbarui status sanksi");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleBulkApprovePending = () => {
    if (pendingCasesInView.length === 0) return;
    setConfirmConfig({
      title: "Verifikasi Semua Usulan Fasil",
      message: `Setujui dan verifikasi ${pendingCasesInView.length} usulan sanksi dari Fasilitator yang berstatus Menunggu?`,
      onConfirm: async () => {
        try {
          const ids = pendingCasesInView.map(c => c.id);
          const res = await fetch('/api/admin/monitoring/sanksi', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, status: 'APPROVED' })
          });
          const json = await res.json();
          if (res.ok && json.success) {
            toast.success(`${ids.length} usulan sanksi berhasil diverifikasi!`);
            fetchData();
          } else {
            toast.error(json.error || "Gagal memverifikasi massal");
          }
        } catch (err) {
          toast.error("Terjadi kesalahan jaringan");
        }
      }
    });
  };

  const handleExecuteExportCSV = async (e) => {
    if (e) e.preventDefault();
    if (exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
      return toast.error("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
    }

    setExporting(true);
    try {
      const hasRange = Boolean(exportStartDate || exportEndDate);
      const params = {
        bulan: hasRange ? 'all' : bulan,
        tahun: hasRange ? 'all' : tahun,
        wilayah,
        angkatan,
        kategori,
        status: exportStatusFilter
      };
      if (exportStartDate) params.startDate = exportStartDate;
      if (exportEndDate) params.endDate = exportEndDate;

      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/admin/monitoring/sanksi?${qs}`);
      if (!res.ok) {
        toast.error("Gagal mengambil data sanksi untuk ekspor");
        return;
      }
      const exportData = await res.json();

      const summaryRows = (exportData?.summaryByEtoser || []).filter(row =>
        row.etoserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.etoserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.pelanggaranRingkas.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const caseRows = (exportData?.cases || []).filter(row =>
        row.etoserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.etoserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.detailPelanggaran.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const rowsToExport = exportMode === 'rekap' ? summaryRows : caseRows;
      if (rowsToExport.length === 0) {
        toast.error("Tidak ada data sanksi pada rentang tanggal / filter yang dipilih");
        return;
      }

      const rangeLabel = hasRange
        ? `${exportStartDate || 'Awal'} s/d ${exportEndDate || 'Sekarang'}`
        : `${bulan === 'all' ? 'Semua Bulan' : bulan} ${tahun === 'all' ? 'Semua Tahun' : tahun}`;

      const csvRows = [];

      if (exportMode === 'rekap') {
        const headers = [
          "ID Etoser",
          "Nama Etoser",
          "Wilayah",
          "Angkatan",
          "Periode Bulan",
          "Periode Tahun",
          "Rentang Tanggal Export",
          "Tanggal Input Terakhir",
          "Jumlah Pelanggaran",
          "Total Poin Sanksi",
          "Potongan Uang Saku (Credit Perform)",
          "Status Verifikasi",
          "Rincian Daftar Pelanggaran"
        ];
        csvRows.push(headers.join(","));

        summaryRows.forEach(row => {
          const statusSummary = row.pendingCount > 0
            ? `${row.approvedCount} Terverifikasi, ${row.pendingCount} Menunggu`
            : 'Terverifikasi Semua';
          const values = [
            `"${row.etoserId}"`,
            `"${row.etoserName.replace(/"/g, '""')}"`,
            `"${row.wilayah}"`,
            `"${row.angkatan}"`,
            `"${row.periodMonth}"`,
            `"${row.periodYear}"`,
            `"${rangeLabel}"`,
            `"${formatDateTimeID(row.latestTimestamp)}"`,
            row.totalKasus,
            row.totalPoin,
            `"${row.totalCreditDeduction}"`,
            `"${statusSummary}"`,
            `"${row.pelanggaranRingkas.replace(/"/g, '""')}"`
          ];
          csvRows.push(values.join(","));
        });
      } else {
        const headers = [
          "ID Sanksi",
          "Tanggal Input",
          "ID Etoser",
          "Nama Etoser",
          "Wilayah",
          "Angkatan",
          "Periode Bulan",
          "Periode Tahun",
          "Kategori Pelanggaran",
          "Detail Pelanggaran",
          "Masa Perbaikan",
          "Poin Sanksi",
          "Potongan Uang Saku (Credit Perform)",
          "Status Verifikasi",
          "Keterangan / Kronologi",
          "Pelapor"
        ];
        csvRows.push(headers.join(","));

        caseRows.forEach(row => {
          const statusLabel = row.status === 'APPROVED'
            ? 'Terverifikasi'
            : row.status === 'REJECTED'
              ? 'Ditolak'
              : 'Menunggu Verifikasi';
          const values = [
            `"${row.id}"`,
            `"${formatDateTimeID(row.timestamp)}"`,
            `"${row.etoserId}"`,
            `"${row.etoserName.replace(/"/g, '""')}"`,
            `"${row.wilayah}"`,
            `"${row.angkatan}"`,
            `"${row.periodMonth}"`,
            `"${row.periodYear}"`,
            `"${row.kategori}"`,
            `"${row.detailPelanggaran.replace(/"/g, '""')}"`,
            `"${row.masaPerbaikan}"`,
            row.poin,
            `"${row.creditPerform}"`,
            `"${statusLabel}"`,
            `"${(row.keterangan || '-').replace(/"/g, '""')}"`,
            `"${(row.fasilName || '-').replace(/"/g, '""')}"`
          ];
          csvRows.push(values.join(","));
        });
      }

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const periodSlug = hasRange
        ? `${exportStartDate || 'awal'}_sd_${exportEndDate || 'akhir'}`
        : `${bulan === 'all' ? 'semua-bulan' : bulan.toLowerCase()}_${tahun}`;
      link.setAttribute("href", url);
      link.setAttribute("download", `daftar_sanksi_credit_etoser_${exportMode}_${periodSlug}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Berhasil mengekspor ${rowsToExport.length} data sanksi ke CSV!`);
      setIsExportModalOpen(false);
    } catch (err) {
      toast.error("Gagal mengekspor data ke CSV");
    } finally {
      setExporting(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formUserId || !formKatalogId) {
      return toast.error("Pilih Etoser dan jenis pelanggaran terlebih dahulu");
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/monitoring/sanksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: formUserId,
          katalog_sanksi_id: formKatalogId,
          keterangan: formKeterangan,
          period_month: formBulan,
          period_year: formTahun
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Sanksi Etoser berhasil ditambahkan & langsung terverifikasi!");
        setIsAddModalOpen(false);
        setFormUserId('');
        setFormKatalogId('');
        setFormKeterangan('');
        fetchData();
      } else {
        toast.error(json.error || "Gagal menyimpan sanksi");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCase = (id, etoserName) => {
    setConfirmConfig({
      title: "Hapus Catatan Sanksi",
      message: `Yakin ingin menghapus catatan pelanggaran untuk ${etoserName}? Poin dan potongan credit akan otomatis diperbarui.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/monitoring/sanksi?id=${encodeURIComponent(id)}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            toast.success("Catatan sanksi berhasil dihapus");
            fetchData();
          } else {
            toast.error("Gagal menghapus catatan sanksi");
          }
        } catch (err) {
          toast.error("Terjadi kesalahan jaringan");
        }
      }
    });
  };

  const renderStatusBadge = (status) => {
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Terverifikasi
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
          <XCircle className="w-3 h-3" /> Ditolak
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3" /> Menunggu Verifikasi
      </span>
    );
  };

  const hasActiveDateRange = Boolean(startDate || endDate);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Filters Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2.5 md:p-3.5 shadow-sm space-y-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center w-full">
          {/* Month & Year Select */}
          <div className={`col-span-2 sm:col-span-1 flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 md:py-2 rounded-xl w-full ${hasActiveDateRange ? 'opacity-50' : ''}`}>
            <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <select 
              value={bulan} 
              onChange={(e) => {
                setStartDate('');
                setEndDate('');
                setBulan(e.target.value);
              }} 
              className="bg-transparent text-[11px] md:text-xs font-bold text-slate-800 focus:outline-none cursor-pointer flex-1 min-w-0"
            >
              <option value="all">Semua Bulan</option>
              {MONTH_OPTIONS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select 
              value={tahun} 
              onChange={(e) => {
                setStartDate('');
                setEndDate('');
                setTahun(e.target.value);
              }} 
              className="bg-transparent text-[11px] md:text-xs font-bold text-slate-800 focus:outline-none cursor-pointer border-l border-slate-200 pl-1.5 shrink-0"
            >
              <option value="all">Semua</option>
              {YEAR_OPTIONS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Wilayah Select */}
          <select 
            value={wilayah} 
            onChange={(e) => setWilayah(e.target.value)} 
            className="w-full py-1.5 md:py-2 px-2.5 md:px-3 bg-white border border-slate-200 rounded-xl text-[11px] md:text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-bold"
          >
            <option value="all">Semua Wilayah</option>
            <option value="Aceh">Aceh</option>
            <option value="Padang">Padang</option>
            <option value="Bogor">Bogor</option>
            <option value="Jakarta">Jakarta</option>
            <option value="Makassar">Makassar</option>
          </select>

          {/* Angkatan Select */}
          <select 
            value={angkatan} 
            onChange={(e) => setAngkatan(e.target.value)} 
            className="w-full py-1.5 md:py-2 px-2.5 md:px-3 bg-white border border-slate-200 rounded-xl text-[11px] md:text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-bold"
          >
            <option value="all">Semua Angkatan</option>
            <option value="2023">Angkatan 2023</option>
            <option value="2024">Angkatan 2024</option>
            <option value="2025">Angkatan 2025</option>
            <option value="2026">Angkatan 2026</option>
          </select>

          {/* Kategori Pelanggaran Filter */}
          <select 
            value={kategori} 
            onChange={(e) => setKategori(e.target.value)} 
            className="w-full py-1.5 md:py-2 px-2.5 md:px-3 bg-white border border-slate-200 rounded-xl text-[11px] md:text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-bold"
          >
            <option value="all">Semua Kategori</option>
            {kategoriOptions.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          {/* Status Verifikasi Filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="w-full py-1.5 md:py-2 px-2.5 md:px-3 bg-white border border-slate-200 rounded-xl text-[11px] md:text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 font-bold"
          >
            <option value="all">Semua Status</option>
            <option value="PENDING">Menunggu Verifikasi</option>
            <option value="APPROVED">Terverifikasi</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>

        {/* Date Range Filter Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px] md:text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            Filter Rentang Tanggal Input:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap flex-1 sm:flex-initial">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              title="Dari Tanggal"
            />
            <span className="text-slate-400 font-bold">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              title="Sampai Tanggal"
            />
            {hasActiveDateRange && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" /> Reset Tanggal
              </button>
            )}
          </div>
          {hasActiveDateRange && (
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
              Menampilkan data tanggal {startDate || 'Awal'} s/d {endDate || 'Sekarang'}
            </span>
          )}
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title="Etoser Kena Sanksi" 
          value={data?.stats?.etoserKenaSanksi || 0} 
          unit="Etoser" 
          icon={Users} 
          color="rose" 
          loading={loading} 
        />
        <StatCard 
          title="Menunggu Verifikasi" 
          value={data?.stats?.menungguVerifikasi || 0} 
          unit="Usulan Fasil" 
          icon={Clock} 
          color="amber" 
          loading={loading} 
        />
        <StatCard 
          title="Akumulasi Poin" 
          value={data?.stats?.totalPoin || 0} 
          unit="Poin" 
          icon={AlertTriangle} 
          color="orange" 
          loading={loading} 
        />
        <StatCard 
          title="Potongan ≥30% / DO" 
          value={data?.stats?.kasusBeratAtauDO || 0} 
          unit="Etoser" 
          icon={Wallet} 
          color="purple" 
          loading={loading} 
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm space-y-5">
        
        {/* Header & Action Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-base md:text-xl font-black text-slate-900">
              Verifikasi & Daftar Penerima Sanksi (Credit Point)
            </h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">
              Verifikasi usulan sanksi dari Fasilitator atau tambahkan sanksi langsung sebagai dasar pemotongan uang saku Keuangan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-[11px] md:text-xs font-bold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setViewMode('rekap')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'rekap'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Rekap Keuangan
              </button>
              <button
                type="button"
                onClick={() => setViewMode('rincian')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'rincian'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Rincian Kasus
              </button>
            </div>

            {pendingCasesInView.length > 0 && (
              <button
                type="button"
                onClick={handleBulkApprovePending}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Verifikasi Semua ({pendingCasesInView.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => openAddModalForEtoser()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-700" /> Input Sanksi Admin
            </button>

            <button
              type="button"
              onClick={openExportModal}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-teal-900/10 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari nama Etoser, ID, atau jenis pelanggaran..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
          />
        </div>

        {/* VIEW MODE 1: REKAP KEUANGAN PER ETOSER */}
        {viewMode === 'rekap' ? (
          <>
            {/* Mobile Card List View (< md) */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="p-8 text-center text-teal-600"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
              ) : filteredSummary.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white/70 rounded-2xl border border-slate-100">
                  Belum ada data sanksi Etoser pada periode dan filter ini.
                </div>
              ) : (
                filteredSummary.map((row, idx) => {
                  const isHeavy = row.totalCreditDeduction === 'DO' || row.totalPoin >= 30;
                  return (
                    <div key={idx} className="bg-white/95 border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{row.etoserName}</h4>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {row.etoserId} • {row.wilayah} ({row.angkatan})
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className="inline-block text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                              Periode: {row.periodMonth} {row.periodYear}
                            </span>
                            <button
                              type="button"
                              onClick={() => openAddModalForEtoser(row.etoserId, row.periodMonth, row.periodYear)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-white border border-teal-200 hover:bg-teal-50 px-2 py-0.5 rounded-md cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" /> Tambah Sanksi
                            </button>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black border ${
                            isHeavy
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            Potongan: {row.totalCreditDeduction}
                          </span>
                          <p className="text-[10px] font-bold text-rose-600 mt-1">
                            Total: {row.totalPoin} Poin ({row.totalKasus} kasus)
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Daftar Pelanggaran & Verifikasi:
                        </span>
                        {row.cases.map((c) => (
                          <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {renderStatusBadge(c.status)}
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                    {c.kategori}
                                  </span>
                                  <span className="text-[10px] font-black text-rose-600">
                                    {c.poin} Poin ({c.creditPerform})
                                  </span>
                                </div>
                                <p className="text-slate-800 font-semibold leading-snug">{c.detailPelanggaran}</p>
                                <p className="text-[10px] text-slate-400">
                                  Tgl Input: {formatDateID(c.timestamp)} • Masa: {c.masaPerbaikan} • Oleh: {c.fasilName}
                                </p>
                                {c.keterangan && c.keterangan !== '-' && (
                                  <p className="text-[11px] text-slate-500 italic">"{c.keterangan}"</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteCase(c.id, row.etoserName)}
                                className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg shrink-0 cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {c.status === 'PENDING' && (
                              <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                                <button
                                  type="button"
                                  disabled={verifyingId === c.id}
                                  onClick={() => handleVerifyCase(c.id, 'APPROVED')}
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {verifyingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  Verifikasi & Setujui
                                </button>
                                <button
                                  type="button"
                                  disabled={verifyingId === c.id}
                                  onClick={() => handleVerifyCase(c.id, 'REJECTED')}
                                  className="py-1.5 px-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <X className="w-3.5 h-3.5" /> Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="p-4 font-black">Etoser & ID</th>
                    <th className="p-4 font-black">Wilayah / Angkatan</th>
                    <th className="p-4 font-black text-center">Periode</th>
                    <th className="p-4 font-black text-center">Total Poin</th>
                    <th className="p-4 font-black text-center">Potongan Credit (Uang Saku)</th>
                    <th className="p-4 font-black">Rincian Pelanggaran & Verifikasi Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-teal-600">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredSummary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">
                        Tidak ada data penerima sanksi untuk filter periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredSummary.map((row, idx) => {
                      const isHeavy = row.totalCreditDeduction === 'DO' || row.totalPoin >= 30;
                      return (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-teal-50/30 transition-colors align-top">
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 text-sm">{row.etoserName}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{row.etoserId}</div>
                            <button
                              type="button"
                              onClick={() => openAddModalForEtoser(row.etoserId, row.periodMonth, row.periodYear)}
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Tambah Sanksi
                            </button>
                          </td>
                          <td className="p-4 font-semibold text-slate-600 whitespace-nowrap">
                            {row.wilayah} <span className="text-slate-300 mx-1">•</span> {row.angkatan}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                              {row.periodMonth} {row.periodYear}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-black text-sm ${
                              isHeavy ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {row.totalPoin} Poin
                            </span>
                            <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                              {row.totalKasus} Pelanggaran
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${
                              isHeavy
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                              <Wallet className="w-3.5 h-3.5" />
                              {row.totalCreditDeduction === 'DO' ? 'Rekomendasi DO' : `Potong ${row.totalCreditDeduction}`}
                            </span>
                            {row.pendingCount > 0 && (
                              <span className="block text-[10px] font-bold text-amber-700 mt-1">
                                {row.pendingCount} usulan menunggu verifikasi
                              </span>
                            )}
                          </td>
                          <td className="p-4 min-w-[380px]">
                            <div className="space-y-2">
                              {row.cases.map((c) => (
                                <div key={c.id} className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-start justify-between gap-3 shadow-2xs">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {renderStatusBadge(c.status)}
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                        {c.kategori}
                                      </span>
                                      <span className="text-[10px] font-black text-rose-700">
                                        {c.poin} Poin • Credit: {c.creditPerform}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-500">
                                        • Tgl Input: {formatDateID(c.timestamp)}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        • Oleh: {c.fasilName}
                                      </span>
                                    </div>
                                    <p className="font-bold text-slate-800 text-xs leading-snug">{c.detailPelanggaran}</p>
                                    {c.keterangan && c.keterangan !== '-' && (
                                      <p className="text-[11px] text-slate-500 italic">Catatan: "{c.keterangan}"</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {c.status === 'PENDING' && (
                                      <>
                                        <button
                                          type="button"
                                          disabled={verifyingId === c.id}
                                          onClick={() => handleVerifyCase(c.id, 'APPROVED')}
                                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                          title="Verifikasi & Setujui Sanksi"
                                        >
                                          {verifyingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                          Setujui
                                        </button>
                                        <button
                                          type="button"
                                          disabled={verifyingId === c.id}
                                          onClick={() => handleVerifyCase(c.id, 'REJECTED')}
                                          className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                          title="Tolak Usulan"
                                        >
                                          <X className="w-3.5 h-3.5" /> Tolak
                                        </button>
                                      </>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCase(c.id, row.etoserName)}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus kasus ini"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* VIEW MODE 2: RINCIAN PER KASUS PELANGGARAN */
          <>
            {/* Mobile Card View (< md) */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="p-8 text-center text-teal-600"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
              ) : filteredCases.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white/70 rounded-2xl border border-slate-100">
                  Tidak ada rincian kasus pelanggaran ditemukan.
                </div>
              ) : (
                filteredCases.map((c) => (
                  <div key={c.id} className="bg-white/95 border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{c.etoserName}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">{c.etoserId} • {c.wilayah} ({c.angkatan})</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCase(c.id, c.etoserName)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {renderStatusBadge(c.status)}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        {c.periodMonth} {c.periodYear}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {c.kategori}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {c.poin} Poin • Potongan: {c.creditPerform}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{c.detailPelanggaran}</p>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                      <span>Tgl Input: <strong>{formatDateID(c.timestamp)}</strong></span>
                      <span>•</span>
                      <span>Masa Perbaikan: <strong>{c.masaPerbaikan}</strong></span>
                      <span>•</span>
                      <span>Oleh: <strong>{c.fasilName}</strong></span>
                    </div>
                    {c.keterangan && c.keterangan !== '-' && (
                      <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg">"{c.keterangan}"</p>
                    )}
                    {c.status === 'PENDING' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={verifyingId === c.id}
                          onClick={() => handleVerifyCase(c.id, 'APPROVED')}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Setujui
                        </button>
                        <button
                          type="button"
                          disabled={verifyingId === c.id}
                          onClick={() => handleVerifyCase(c.id, 'REJECTED')}
                          className="py-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="p-4 font-black">Etoser & ID</th>
                    <th className="p-4 font-black">Wilayah / Angkatan</th>
                    <th className="p-4 font-black">Tgl Input / Periode</th>
                    <th className="p-4 font-black">Kategori & Pelanggaran</th>
                    <th className="p-4 font-black text-center">Poin</th>
                    <th className="p-4 font-black text-center">Credit Perform</th>
                    <th className="p-4 font-black text-center">Status Verifikasi</th>
                    <th className="p-4 font-black">Keterangan / Pelapor</th>
                    <th className="p-4 font-black text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="p-10 text-center text-teal-600"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : filteredCases.length === 0 ? (
                    <tr><td colSpan={9} className="p-10 text-center text-slate-400 font-medium">Tidak ada kasus pelanggaran ditemukan.</td></tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-teal-50/30 transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-sm">{c.etoserName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{c.etoserId}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-600 whitespace-nowrap">
                          {c.wilayah} • {c.angkatan}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{formatDateID(c.timestamp)}</div>
                          <div className="text-[10px] font-bold text-teal-700">{c.periodMonth} {c.periodYear}</div>
                        </td>
                        <td className="p-4 max-w-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              {c.kategori}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Masa: {c.masaPerbaikan}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 leading-snug">{c.detailPelanggaran}</p>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className="font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">{c.poin}</span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className="font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">{c.creditPerform}</span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          {renderStatusBadge(c.status)}
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="text-slate-700 truncate" title={c.keterangan}>{c.keterangan}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">Oleh: {c.fasilName}</span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={verifyingId === c.id}
                                  onClick={() => handleVerifyCase(c.id, 'APPROVED')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Setujui
                                </button>
                                <button
                                  type="button"
                                  disabled={verifyingId === c.id}
                                  onClick={() => handleVerifyCase(c.id, 'REJECTED')}
                                  className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" /> Tolak
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteCase(c.id, c.etoserName)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Export CSV dengan Pemilihan Rentang Tanggal */}
      {isExportModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsExportModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden cursor-default"
          >
            <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-700 to-teal-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/15">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">Export CSV Daftar Sanksi</h3>
                  <p className="text-xs text-teal-100">Pilih rentang tanggal spesifik & format laporan Keuangan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteExportCSV} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Pintasan Rentang Waktu</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyExportDatePreset('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      !exportStartDate && !exportEndDate
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Sesuai Filter Bulan ({bulan === 'all' ? 'Semua' : bulan} {tahun})
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExportDatePreset('today')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 transition-colors cursor-pointer"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExportDatePreset('7d')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 transition-colors cursor-pointer"
                  >
                    7 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExportDatePreset('30d')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 transition-colors cursor-pointer"
                  >
                    30 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExportDatePreset('thisMonth')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 transition-colors cursor-pointer"
                  >
                    Bulan Ini
                  </button>
                </div>
              </div>

              {/* Date Range Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dari Tanggal</label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Format Laporan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Format Laporan CSV</label>
                <select
                  value={exportMode}
                  onChange={(e) => setExportMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="rekap">Rekap Potongan Per Etoser (Keuangan & Credit Point)</option>
                  <option value="rincian">Rincian Kasus Pelanggaran (Lengkap Tanggal Input)</option>
                </select>
              </div>

              {/* Filter Status Verifikasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Sanksi yang Diekspor</label>
                <select
                  value={exportStatusFilter}
                  onChange={(e) => setExportStatusFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="all">Semua Status (Terverifikasi & Menunggu)</option>
                  <option value="APPROVED">Hanya yang Sudah Terverifikasi (Approved)</option>
                  <option value="PENDING">Hanya yang Menunggu Verifikasi (Pending)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-xs text-teal-900 space-y-1">
                <p className="font-bold">Ringkasan Rentang Export:</p>
                <p className="text-[11px] text-teal-800">
                  {exportStartDate || exportEndDate
                    ? `Mengekspor data sanksi yang diinput mulai ${exportStartDate || 'awal'} sampai ${exportEndDate || 'hari ini'}.`
                    : `Mengekspor data sanksi periode ${bulan === 'all' ? 'Semua Bulan' : bulan} ${tahun === 'all' ? 'Semua Tahun' : tahun}.`}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={exporting}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Unduh CSV Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Tambah Sanksi oleh Admin */}
      {isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsAddModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden cursor-default"
          >
            <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-700 to-teal-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/15">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">Input Sanksi Etoser (Admin)</h3>
                  <p className="text-xs text-teal-100">Sanksi yang diinput Admin otomatis berstatus Terverifikasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Etoser *</label>
                <select
                  required
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">-- Pilih Etoser --</option>
                  {(data?.etoserOptions || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.id} • {u.wilayah} • {u.angkatan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Periode Bulan *</label>
                  <select
                    value={formBulan}
                    onChange={(e) => setFormBulan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Periode Tahun *</label>
                  <select
                    value={formTahun}
                    onChange={(e) => setFormTahun(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Filter Kategori</label>
                  <select
                    value={formKategori}
                    onChange={(e) => {
                      setFormKategori(e.target.value);
                      setFormKatalogId('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">Semua Kategori</option>
                    {kategoriOptions.map((kat) => (
                      <option key={kat} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pelanggaran *</label>
                  <select
                    required
                    value={formKatalogId}
                    onChange={(e) => setFormKatalogId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">-- Pilih Pelanggaran --</option>
                    {filteredModalKatalog.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.poin} Poin | {item.credit_perform}] {item.detail_pelanggaran}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {chosenCatalogItem && (
                <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs space-y-1">
                  <p className="font-bold text-rose-950">{chosenCatalogItem.detail_pelanggaran}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold text-rose-800 pt-1">
                    <span>Poin: <strong>{chosenCatalogItem.poin}</strong></span>
                    <span>•</span>
                    <span>Potongan Credit: <strong>{chosenCatalogItem.credit_perform}</strong></span>
                    <span>•</span>
                    <span>Masa Perbaikan: <strong>{chosenCatalogItem.masa_perbaikan}</strong></span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Kronologi</label>
                <textarea
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Catatan verifikasi atau kronologi pelanggaran..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Simpan & Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={!!confirmConfig}
        onClose={() => setConfirmConfig(null)}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        onConfirm={confirmConfig?.onConfirm}
      />

    </div>
  );
}
