"use client";
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useMemo, Suspense } from "react";
import { Users, UserPlus, Search, Edit2, Trash2, MoreHorizontal, X, Loader2, UploadCloud, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CsvImportModal from "@/components/admin/settings/CsvImportModal";

function AdminUsersContent() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [parsedCsvData, setParsedCsvData] = useState(null);
  const [csvErrors, setCsvErrors] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  // Settings state
  const [wilayahOptions, setWilayahOptions] = useState([]);
  const [fasilRoleOptions, setFasilRoleOptions] = useState([]);
  const [formData, setFormData] = useState({
    id: "", name: "", role: "Etoser", angkatan: "", wilayah: "", password: "", fase: "T0", fasil_role: "Reguler", relasi_etoser: ""
  });

  const etoserDiWilayah = useMemo(() => {
    if (formData.role !== 'Fasilitator' || !formData.wilayah) return [];
    return users.filter(u => u.role === 'Etoser' && (u.wilayah || "").toLowerCase() === formData.wilayah.toLowerCase());
  }, [users, formData.role, formData.wilayah]);

  const assignedEtoserMap = useMemo(() => {
    const map = {};
    users.forEach(u => {
      const isFasil = u.role === 'Fasilitator' || u.role === 'Fasil' || u.role === 'FASIL';
      const isCurrentFasil = u.id === formData.id;
      if (isFasil && !isCurrentFasil && u.relasi_etoser) {
        const etoserIds = u.relasi_etoser.split(',').map(id => id.trim()).filter(Boolean);
        etoserIds.forEach(id => {
          map[id] = u.name;
        });
      }
    });
    return map;
  }, [users, formData.id]);

  const handleRelasiEtoserToggle = (etoserId) => {
    const current = formData.relasi_etoser ? formData.relasi_etoser.split(',').filter(Boolean) : [];
    if (current.includes(etoserId)) {
      setFormData({ ...formData, relasi_etoser: current.filter(id => id !== etoserId).join(',') });
    } else {
      setFormData({ ...formData, relasi_etoser: [...current, etoserId].join(',') });
    }
  };

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const searchQuery = searchParams.get('search') || '';
  const roleFilter = searchParams.get('role') || 'All Roles';
  const faseFilter = searchParams.get('fase') || 'All Fases';
  const currentPage = parseInt(searchParams.get('page')) || 1;

  
  const updateQueryParams = (params) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(params).forEach(([key, value]) => {
      if (!value) current.delete(key);
      else current.set(key, value);
    });
    router.replace(`${pathname}?${current.toString()}`, { scroll: false });
  };

  useEffect(() => {
    fetchUsers();
    fetchSettings();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsBulkModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const wilSetting = data.find(s => s.key === 'daftar_wilayah');
        const roleSetting = data.find(s => s.key === 'role_fasil');
        if (wilSetting && wilSetting.value) {
          setWilayahOptions(wilSetting.value.split(',').map(s => s.trim()).filter(Boolean));
        }
        if (roleSetting && roleSetting.value) {
          setFasilRoleOptions(roleSetting.value.split(',').map(s => s.trim()).filter(Boolean));
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  
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

  const handleBulkDelete = () => {
    setConfirmConfig({
      title: "Hapus Massal",
      message: `Yakin ingin menghapus ${selectedIds.length} data terpilih?`,
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
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ id: "", name: "", role: "Etoser", angkatan: "", wilayah: "", password: "", fase: "T0", fasil_role: "Reguler", relasi_etoser: "" });
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to add user", error);
    }
  };

  const handleEditClick = (user) => {
    setFormData({
      id: user.id,
      name: user.name,
      role: user.role,
      angkatan: user.angkatan || "",
      wilayah: user.wilayah || "",
      password: "",
      fase: user.fase || "T0",
      fasil_role: user.fasil_role || "Reguler",
      relasi_etoser: user.relasi_etoser || ""
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/users/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setFormData({ id: "", name: "", role: "Etoser", angkatan: "", wilayah: "", password: "", fase: "T0", fasil_role: "Reguler", relasi_etoser: "" });
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to edit user", error);
    }
  };


  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setCsvErrors([]);
    setParsedCsvData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 2) {
        setCsvErrors(["File kosong atau tidak memiliki data yang valid."]);
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const usersData = [];
      const idSet = new Set();
      const localErrors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const userObj = {};
        headers.forEach((h, index) => {
          userObj[h] = values[index] || "";
        });
        
        if (userObj.id && userObj.name && userObj.role) {
          // Check duplicates inside CSV
          if (idSet.has(userObj.id)) {
            localErrors.push(`ID duplikat di dalam file CSV: ${userObj.id}`);
          } else {
            idSet.add(userObj.id);
          }
          
          // Check duplicates with existing DB
          if (users.some(u => u.id === userObj.id)) {
            localErrors.push(`ID sudah terdaftar di sistem: ${userObj.id}`);
          }
          
          usersData.push(userObj);
        }
      }
      
      setCsvErrors(localErrors);
      setParsedCsvData(usersData);
    };
    reader.readAsText(file);
  };

  const handleBulkConfirm = async () => {
    if (!parsedCsvData || csvErrors.length > 0) return;
    setBulkLoading(true);

    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedCsvData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setIsBulkModalOpen(false);
        setCsvFile(null);
        setParsedCsvData(null);
        setCsvErrors([]);
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal upload data');
      }
    } catch (error) {
      console.error("Bulk upload failed", error);
      toast.error('Terjadi kesalahan saat upload.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Derived state for filtering and pagination
  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    // Sort alphabetically by name
    result.sort((a, b) => a.name.localeCompare(b.name));

    // Filter by role
    if (roleFilter !== 'All Roles') {
      result = result.filter(u => u.role === roleFilter);
    }

    // Filter by fase (only for Etoser / PM)
    if (faseFilter !== 'All Fases') {
      result = result.filter(u => (u.fase || 'T0') === faseFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.id.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [users, searchQuery, roleFilter, faseFilter]);


  const itemsPerPage = 50;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  
  // Ensure current page is within bounds if data changes
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  
  const paginatedUsers = filteredUsers.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  // Calculate user counts per role for segmented tabs
  const roleCounts = useMemo(() => {
    return {
      all: users.length,
      etoser: users.filter(u => u.role === 'Etoser').length,
      fasil: users.filter(u => u.role === 'Fasilitator').length,
      admin: users.filter(u => u.role === 'Admin').length,
    };
  }, [users]);

  // Group filtered users by wilayah for mobile clustered view
  const groupedUsersByWilayah = useMemo(() => {
    const map = {};
    filteredUsers.forEach(u => {
      const wil = u.wilayah || 'Wilayah Belum Ditentukan';
      if (!map[wil]) map[wil] = [];
      map[wil].push(u);
    });
    const sortedKeys = Object.keys(map).sort((a, b) => {
      if (a.includes('Belum Ditentukan')) return 1;
      if (b.includes('Belum Ditentukan')) return -1;
      return a.localeCompare(b);
    });
    return sortedKeys.map(wil => ({
      wilayah: wil,
      users: map[wil]
    }));
  }, [filteredUsers]);

  // Accordion state for mobile view
  const [expandedWilayah, setExpandedWilayah] = useState(new Set());

  // Auto-expand all matching groups when search query is typed
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedWilayah(new Set(groupedUsersByWilayah.map(g => g.wilayah)));
    }
  }, [searchQuery, groupedUsersByWilayah]);

  const toggleWilayah = (wil) => {
    setExpandedWilayah(prev => {
      const next = new Set(prev);
      if (next.has(wil)) {
        next.delete(wil);
      } else {
        next.add(wil);
      }
      return next;
    });
  };

  const expandAllWilayah = () => {
    setExpandedWilayah(new Set(groupedUsersByWilayah.map(g => g.wilayah)));
  };

  const collapseAllWilayah = () => {
    setExpandedWilayah(new Set());
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 pt-2 md:pt-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-teal-950 tracking-tight mb-1 md:mb-2 drop-shadow-sm flex items-center">
            Manajemen Pengguna 
            <span className="inline-flex items-center justify-center h-6 md:h-8 px-2.5 rounded-full bg-teal-600/10 text-teal-700 text-xs md:text-sm font-bold ml-2.5 border border-teal-600/20">
              {users.length}
            </span>
          </h1>
          <p className="hidden md:block text-teal-800/70 font-medium text-base md:text-lg max-w-xl">
            Kelola akun seluruh pengguna portal (Etoser, Fasilitator, dan Administrator) di seluruh wilayah binaan.
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-bold py-2 md:py-2.5 px-3 md:px-5 rounded-xl shadow-sm text-xs md:text-sm transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> <span>Hapus ({selectedIds.length})</span>
            </button>
          )}
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-white/70 hover:bg-white text-teal-900 font-semibold py-2 md:py-3 px-3 md:px-5 rounded-xl md:rounded-2xl shadow-sm text-xs md:text-sm transition-all flex items-center gap-1.5 shrink-0 border border-teal-200/80 backdrop-blur-md cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 md:w-5 md:h-5 text-teal-700" />
            <span className="hidden sm:inline">Bulk Import</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-teal-800 hover:bg-teal-900 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-xl md:rounded-2xl shadow-lg transition-all flex items-center gap-1.5 shrink-0 text-xs md:text-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
            <span>+ Tambah User</span>
          </button>
        </div>
      </div>

      {/* Main Container Card (Glassmorphic) */}
      <div className="bg-white/40 backdrop-blur-2xl rounded-2xl md:rounded-[2.5rem] shadow-[0_8px_32px_rgba(20,184,166,0.1)] p-4 md:p-8 border border-white/60">
        
        {/* Table / List Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <h2 className="text-lg md:text-xl font-bold text-teal-950">Daftar Pengguna</h2>
            <span className="text-xs font-semibold text-teal-700/70 md:hidden">
              {filteredUsers.length} Ditemukan
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-teal-700/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => updateQueryParams({ search: e.target.value, page: "1" })}
                placeholder="Cari nama atau ID..." 
                className="w-full pl-9 pr-8 py-2 md:py-2.5 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-900 placeholder-teal-800/40 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => updateQueryParams({ search: '', page: "1" })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal-700/50 hover:text-teal-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select 
              value={faseFilter}
              onChange={(e) => updateQueryParams({ fase: e.target.value === 'All Fases' ? '' : e.target.value, page: "1" })}
              className="py-2 md:py-2.5 px-3 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-900 shadow-inner cursor-pointer max-w-[130px] md:max-w-none truncate"
            >
              <option value="All Fases">Semua Fase</option>
              <option value="T0">Fase T0 (Baseline)</option>
              <option value="T1">Fase T1 (Akhir Th 1)</option>
              <option value="T2">Fase T2 (Akhir Th 2)</option>
              <option value="T3">Fase T3 (Akhir Th 3)</option>
              <option value="T4">Fase T4 (Endline)</option>
            </select>
          </div>
        </div>

        {/* DESKTOP VIEW: Full 7-Column Table (Hidden on Mobile) */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-teal-800/60 uppercase tracking-wider border-b-2 border-teal-900/5">
                  <th className="pb-4 pl-4 w-10 text-center">
                    <input type="checkbox" onChange={handleSelectAll} checked={paginatedUsers.length > 0 && selectedIds.length === paginatedUsers.length} className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" />
                  </th>
                  <th className="pb-4 pl-2">User Profile</th>
                  <th className="pb-4">Role</th>
                  <th className="pb-4">Wilayah</th>
                  <th className="pb-4">Fase / Angkatan</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/5">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-teal-800/50 font-medium">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                      Memuat data...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-teal-800/50 font-medium">
                      {searchQuery ? "Tidak ada hasil yang sesuai dengan pencarian." : "Belum ada data pengguna."}
                    </td>
                  </tr>
                ) : paginatedUsers.map((user, i) => (
                  <tr key={i} className="hover:bg-white/40 transition-colors group">
                    <td className="py-5 pl-4 text-center">
                      <input type="checkbox" onChange={(e) => handleSelectOne(user.id, e.target.checked)} checked={selectedIds.includes(user.id)} className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="py-5 pl-2">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border border-white/60
                          ${user.role === 'Etoser' ? 'bg-emerald-100/80 text-emerald-700' : 
                            user.role === 'Fasilitator' ? 'bg-cyan-100/80 text-cyan-700' : 
                            'bg-teal-100/80 text-teal-800'}`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-teal-950 text-base">{user.name}</p>
                          <p className="text-xs text-teal-800/60 font-semibold mt-0.5">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className="font-bold text-teal-900">{user.role}</span>
                    </td>
                    <td className="py-5">
                      <span className="text-teal-800/70 font-medium">{user.wilayah || '-'}</span>
                    </td>
                    <td className="py-5">
                      {user.role === 'Etoser' ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-teal-50 text-teal-800 border border-teal-200">
                            {user.fase || 'T0'}
                          </span>
                          {user.angkatan && user.angkatan !== '-' && (
                            <span className="text-xs text-slate-500 font-semibold">
                              Angk. {user.angkatan}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="py-5">
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold border bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                        Active
                      </span>
                    </td>
                    <td className="py-5 pr-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEditClick(user)} className="p-2 text-teal-700/50 hover:text-teal-600 hover:bg-teal-500/10 rounded-xl transition-colors cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(user)} className="p-2 text-teal-700/50 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desktop Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-teal-900/5 mt-4 pt-6">
              <span className="text-sm font-medium text-teal-800/60">
                Showing {((validCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(validCurrentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={validCurrentPage === 1}
                  onClick={() => updateQueryParams({ page: String(validCurrentPage - 1) })}
                  className="p-2 rounded-xl bg-white/50 border border-teal-100 text-teal-700 hover:bg-white hover:border-teal-300 disabled:opacity-50 disabled:hover:bg-white/50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNumber = idx + 1;
                    if (totalPages > 7 && Math.abs(pageNumber - validCurrentPage) > 2 && pageNumber !== 1 && pageNumber !== totalPages) {
                      if (pageNumber === 2 || pageNumber === totalPages - 1) return <span key={idx} className="text-teal-800/40 px-1">...</span>;
                      return null;
                    }
                    
                    return (
                      <button 
                        key={pageNumber}
                        onClick={() => updateQueryParams({ page: String(pageNumber) })}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                          validCurrentPage === pageNumber 
                          ? 'bg-teal-600 text-white shadow-md' 
                          : 'bg-white/50 text-teal-700 hover:bg-white border border-teal-100 hover:border-teal-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button 
                  disabled={validCurrentPage === totalPages}
                  onClick={() => updateQueryParams({ page: String(validCurrentPage + 1) })}
                  className="p-2 rounded-xl bg-white/50 border border-teal-100 text-teal-700 hover:bg-white hover:border-teal-300 disabled:opacity-50 disabled:hover:bg-white/50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MOBILE VIEW: Clustered by Wilayah Accordion (< md) */}
        <div className="block md:hidden space-y-3">
          {/* Mobile Actions Bar */}
          <div className="flex items-center justify-between px-1 pb-1 text-xs">
            <label className="flex items-center gap-2 font-bold text-teal-950 cursor-pointer">
              <input 
                type="checkbox" 
                onChange={handleSelectAll} 
                checked={paginatedUsers.length > 0 && selectedIds.length === paginatedUsers.length} 
                className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer" 
              />
              <span>Pilih Semua ({filteredUsers.length})</span>
            </label>

            <div className="flex items-center gap-2">
              <button 
                onClick={expandAllWilayah}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
              >
                Buka Semua
              </button>
              <span className="text-teal-300">•</span>
              <button 
                onClick={collapseAllWilayah}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-teal-800/60 font-medium bg-white/40 rounded-2xl border border-white/50">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-600" />
              Memuat data pengguna...
            </div>
          ) : groupedUsersByWilayah.length === 0 ? (
            <div className="py-12 px-4 text-center text-teal-800/60 font-medium bg-white/40 rounded-2xl border border-white/50">
              {searchQuery ? "Tidak ada hasil yang sesuai dengan pencarian." : "Belum ada data pengguna."}
            </div>
          ) : (
            groupedUsersByWilayah.map((group) => {
              const isExpanded = expandedWilayah.has(group.wilayah);
              return (
                <div key={group.wilayah} className="rounded-2xl border border-teal-200/60 bg-white/50 backdrop-blur-md overflow-hidden transition-all shadow-xs">
                  {/* Accordion Wilayah Header */}
                  <button
                    onClick={() => toggleWilayah(group.wilayah)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-white/80 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/70 flex items-center justify-center text-teal-700 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-teal-950 text-sm truncate">{group.wilayah}</h3>
                        <p className="text-[11px] font-medium text-teal-700/70">
                          {group.users.length} Pengguna
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100/80 text-teal-800">
                        {group.users.length}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-teal-700" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-teal-700" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Content: User Cards */}
                  {isExpanded && (
                    <div className="p-2 pt-0 space-y-2 border-t border-teal-100/60 bg-teal-50/20">
                      {group.users.map((user) => {
                        const isSelected = selectedIds.includes(user.id);
                        return (
                          <div 
                            key={user.id}
                            className={`p-3 rounded-xl border transition-all bg-white/90 backdrop-blur-md shadow-xs ${
                              isSelected ? 'border-teal-500 ring-1 ring-teal-500/30 bg-teal-50/50' : 'border-slate-200/70'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Selection Checkbox */}
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleSelectOne(user.id, e.target.checked)}
                                className="mt-1 rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer shrink-0"
                              />

                              {/* Role-Colored Initial Avatar */}
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs border shrink-0 ${
                                user.role === 'Etoser' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                user.role === 'Fasilitator' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-teal-50 text-teal-800 border-teal-200'
                              }`}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>

                              {/* User Info & Actions */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0 pr-1">
                                    <h4 className="font-bold text-teal-950 text-sm leading-snug truncate">
                                      {user.name}
                                    </h4>
                                    <p className="text-[11px] font-semibold text-teal-700/60">
                                      ID: {user.id}
                                    </p>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button 
                                      onClick={() => handleEditClick(user)}
                                      className="p-1.5 text-teal-700 hover:text-teal-950 hover:bg-teal-100/60 rounded-lg transition-colors cursor-pointer"
                                      title="Edit User"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteClick(user)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-lg transition-colors cursor-pointer"
                                      title="Hapus User"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Badges Row */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    user.role === 'Etoser' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                    user.role === 'Fasilitator' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                                    'bg-teal-50 text-teal-800 border-teal-200'
                                  }`}>
                                    {user.role}
                                  </span>

                                  {user.role === 'Etoser' && (
                                    <>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                                        {user.fase || 'T0'}
                                      </span>
                                      {user.angkatan && user.angkatan !== '-' && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                          Angk. {user.angkatan}
                                        </span>
                                      )}
                                    </>
                                  )}

                                  {user.role === 'Fasilitator' && user.fasil_role && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200">
                                      {user.fasil_role}
                                    </span>
                                  )}

                                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                                    Aktif
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
      
      {isAddModalOpen && (
        <div onClick={() => {
          setIsAddModalOpen(false);
          setFormData({ id: "", name: "", role: "Etoser", angkatan: "", wilayah: "", password: "", tahun_pembinaan: "1", fasil_role: "Reguler", relasi_etoser: "" });
        }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/20 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 cursor-default">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-teal-950">Add New User</h3>
              <button onClick={() => {
                setIsAddModalOpen(false);
                setFormData({ id: "", name: "", role: "Etoser", angkatan: "", wilayah: "", password: "", tahun_pembinaan: "1", fasil_role: "Reguler", relasi_etoser: "" });
              }} className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors text-teal-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">User ID</label>
                  <input required type="text" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="e.g. PM-001" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Password</label>
                  <input type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="Biarkan kosong jika tidak ingin ubah/set" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="Budi Santoso" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                  <option>Etoser</option>
                  <option>Fasilitator</option>
                  <option>Admin</option>
                </select>
              </div>
              {formData.role !== 'Admin' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className={formData.role === 'Fasilitator' ? 'col-span-1' : 'col-span-2'}>
                    <label className="block text-sm font-semibold text-teal-900 mb-1">Wilayah</label>
                    <select required={formData.role !== 'Admin'} value={formData.wilayah} onChange={(e) => setFormData({...formData, wilayah: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                      <option value="">-- Pilih Wilayah --</option>
                      {wilayahOptions.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  
                  {formData.role === 'Etoser' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-teal-900 mb-1">Angkatan</label>
                        <input required type="text" value={formData.angkatan} onChange={(e) => setFormData({...formData, angkatan: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="2023" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-teal-900 mb-1">Fase Pembinaan (RELI)</label>
                        <select value={formData.fase || "T0"} onChange={(e) => setFormData({...formData, fase: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950 font-bold">
                          <option value="T0">T0 - Baseline (Awal Masuk Tahun 1)</option>
                          <option value="T1">T1 - Evaluasi Akhir Tahun 1 (Year 1 Endline)</option>
                          <option value="T2">T2 - Evaluasi Akhir Tahun 2 (Year 2 Endline)</option>
                          <option value="T3">T3 - Evaluasi Akhir Tahun 3 (Year 3 Endline)</option>
                          <option value="T4">T4 - Final Endline (Kelulusan Pembinaan)</option>
                        </select>
                      </div>
                    </>
                  )}


                  {formData.role === 'Fasilitator' && (
                    <div className="col-span-2 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-teal-900 mb-1">Role Fasil</label>
                        <select value={formData.fasil_role || "Reguler"} onChange={(e) => setFormData({...formData, fasil_role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                          {fasilRoleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      
                      {formData.wilayah && (
                        <div className="mt-2">
                          <label className="block text-sm font-semibold text-teal-900 mb-2">Relasi Etoser (Wilayah {formData.wilayah})</label>
                          {etoserDiWilayah.length === 0 ? (
                            <p className="text-sm text-teal-800/60">Belum ada Etoser di wilayah ini.</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-white/50 border border-teal-100 rounded-xl shadow-inner">
                              {etoserDiWilayah.map(etoser => {
                                const isChecked = (formData.relasi_etoser || "").split(',').includes(etoser.id);
                                const assignedFasil = assignedEtoserMap[etoser.id];
                                const isLocked = assignedFasil && !isChecked;
                                return (
                                  <label 
                                    key={etoser.id} 
                                    className={`flex items-center gap-2 group ${
                                      isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked} 
                                      disabled={isLocked}
                                      onChange={() => !isLocked && handleRelasiEtoserToggle(etoser.id)}
                                      className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 disabled:bg-slate-200/50 disabled:border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm text-teal-900 font-medium truncate group-hover:text-teal-700">{etoser.name}</span>
                                      <span className={`text-xs font-semibold ${isLocked ? 'text-amber-600' : 'text-teal-700/60'}`}>
                                        {etoser.id} {isLocked && `• Fasil: ${assignedFasil}`}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95">
                Save User
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div onClick={() => {
          setIsEditModalOpen(false);
          setFormData({ id: "", name: "", role: "Etoser", angkatan: "", wilayah: "", password: "", tahun_pembinaan: "1", fasil_role: "Reguler", relasi_etoser: "" });
        }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/20 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 cursor-default">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-teal-950">Edit User</h3>
              <button onClick={() => {
                setIsEditModalOpen(false);
                setFormData({ id: "", name: "", role: "Etoser", angkatan: "", wilayah: "", password: "", tahun_pembinaan: "1", fasil_role: "Reguler", relasi_etoser: "" });
              }} className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors text-teal-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">User ID</label>
                  <input disabled type="text" value={formData.id} className="w-full px-4 py-3 rounded-xl bg-teal-50/50 border border-teal-100/50 text-teal-900/60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-teal-900 mb-1">Password</label>
                  <input type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="Ketik untuk mengubah password" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="Budi Santoso" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-teal-900 mb-1">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                  <option>Etoser</option>
                  <option>Fasilitator</option>
                  <option>Admin</option>
                </select>
              </div>
              {formData.role !== 'Admin' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className={formData.role === 'Fasilitator' ? 'col-span-1' : 'col-span-2'}>
                    <label className="block text-sm font-semibold text-teal-900 mb-1">Wilayah</label>
                    <select required={formData.role !== 'Admin'} value={formData.wilayah} onChange={(e) => setFormData({...formData, wilayah: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                      <option value="">-- Pilih Wilayah --</option>
                      {wilayahOptions.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  
                  {formData.role === 'Etoser' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-teal-900 mb-1">Angkatan</label>
                        <input required type="text" value={formData.angkatan} onChange={(e) => setFormData({...formData, angkatan: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950" placeholder="2023" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-teal-900 mb-1">Fase Pembinaan (RELI)</label>
                        <select value={formData.fase || "T0"} onChange={(e) => setFormData({...formData, fase: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950 font-bold">
                          <option value="T0">T0 - Baseline (Awal Masuk Tahun 1)</option>
                          <option value="T1">T1 - Evaluasi Akhir Tahun 1 (Year 1 Endline)</option>
                          <option value="T2">T2 - Evaluasi Akhir Tahun 2 (Year 2 Endline)</option>
                          <option value="T3">T3 - Evaluasi Akhir Tahun 3 (Year 3 Endline)</option>
                          <option value="T4">T4 - Final Endline (Kelulusan Pembinaan)</option>
                        </select>
                      </div>
                    </>
                  )}


                  {formData.role === 'Fasilitator' && (
                    <div className="col-span-2 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-teal-900 mb-1">Role Fasil</label>
                        <select value={formData.fasil_role || "Reguler"} onChange={(e) => setFormData({...formData, fasil_role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/50 border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-teal-950">
                          {fasilRoleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      
                      {formData.wilayah && (
                        <div className="mt-2">
                          <label className="block text-sm font-semibold text-teal-900 mb-2">Relasi Etoser (Wilayah {formData.wilayah})</label>
                          {etoserDiWilayah.length === 0 ? (
                            <p className="text-sm text-teal-800/60">Belum ada Etoser di wilayah ini.</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-white/50 border border-teal-100 rounded-xl shadow-inner">
                              {etoserDiWilayah.map(etoser => {
                                const isChecked = (formData.relasi_etoser || "").split(',').includes(etoser.id);
                                const assignedFasil = assignedEtoserMap[etoser.id];
                                const isLocked = assignedFasil && !isChecked;
                                return (
                                  <label 
                                    key={etoser.id} 
                                    className={`flex items-center gap-2 group ${
                                      isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked} 
                                      disabled={isLocked}
                                      onChange={() => !isLocked && handleRelasiEtoserToggle(etoser.id)}
                                      className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4 disabled:bg-slate-200/50 disabled:border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm text-teal-900 font-medium truncate group-hover:text-teal-700">{etoser.name}</span>
                                      <span className={`text-xs font-semibold ${isLocked ? 'text-amber-600' : 'text-teal-700/60'}`}>
                                        {etoser.id} {isLocked && `• Fasil: ${assignedFasil}`}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95">
                Update User
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div onClick={() => setIsDeleteModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/30 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95 duration-300 cursor-default">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Trash2 className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-2xl font-black text-teal-950 mb-2">Delete User?</h3>
            <p className="text-teal-800/80 font-medium mb-8">
              Apakah lu yakin mau menghapus user <strong>{selectedUser?.name}</strong>? Data yang dihapus nggak bisa dikembalikan.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 bg-white hover:bg-teal-50 text-teal-900 font-bold py-3 rounded-xl transition-all shadow-sm border border-teal-100"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-[0_4px_15px_rgba(225,29,72,0.2)] transition-all active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Bulk Import Modal */}
      <CsvImportModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        onImportSuccess={fetchUsers} 
        endpoint="users/bulk" 
        templateHeaders={['id', 'name', 'role', 'angkatan', 'wilayah', 'password', 'fase', 'fasil_role']} 
        templateFileName="template_users.csv" 
      />


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

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>}>
      <AdminUsersContent />
    </Suspense>
  );
}