"use client";
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Trophy, Save, Plus, Trash2, Link as LinkIcon, Loader2, Camera, GraduationCap, Phone, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20 text-sky-600">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    }>
      <ProfilContent />
    </Suspense>
  );
}

function ProfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? (searchParams.get('tab') || 'profil') : 'profil';
  const [activeTab, setActiveTab] = useState(currentTab);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t && (t === 'profil' || t === 'portofolio')) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    router.push(`/etoser/profil?tab=${newTab}`);
  };
  
  // Profil State
  const [profil, setProfil] = useState({});
  const [loadingProfil, setLoadingProfil] = useState(true);
  const [savingProfil, setSavingProfil] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG/PNG/WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setProfil(prev => ({ ...prev, foto_profil: base64 }));
        toast.success('Foto berhasil dipilih! Klik "Simpan Perubahan" untuk menerapkan.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  // Portofolio State
  const [portofolios, setPortofolios] = useState([]);
  const [loadingPorto, setLoadingPorto] = useState(true);
  const [isAddingPorto, setIsAddingPorto] = useState(false);
  const [newPorto, setNewPorto] = useState({
    kategori: 'Prestasi',
    judul_karya: '',
    tahun: new Date().getFullYear().toString(),
    deskripsi_singkat: '',
    link_bukti: ''
  });
  const [savingPorto, setSavingPorto] = useState(false);

  useEffect(() => {
    fetchProfil();
    fetchPortofolio();
  }, []);

  const fetchProfil = async () => {
    setLoadingProfil(true);
    try {
      const res = await fetch('/api/etoser/profil');
      if (res.ok) {
        const data = await res.json();
        setProfil(data);
      }
    } catch (error) {
      toast.error('Gagal memuat profil');
    } finally {
      setLoadingProfil(false);
    }
  };

  const fetchPortofolio = async () => {
    setLoadingPorto(true);
    try {
      const res = await fetch('/api/etoser/portofolio');
      if (res.ok) {
        const data = await res.json();
        setPortofolios(data);
      }
    } catch (error) {
      toast.error('Gagal memuat portofolio');
    } finally {
      setLoadingPorto(false);
    }
  };

  const handleSaveProfil = async (e) => {
    e.preventDefault();
    setSavingProfil(true);
    try {
      const res = await fetch('/api/etoser/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profil)
      });
      if (res.ok) {
        toast.success('Profil berhasil disimpan!');
      } else {
        toast.error('Gagal menyimpan profil');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSavingProfil(false);
    }
  };

  const handleSavePorto = async (e) => {
    e.preventDefault();
    setSavingPorto(true);
    try {
      const res = await fetch('/api/etoser/portofolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPorto)
      });
      if (res.ok) {
        toast.success('Portofolio berhasil ditambahkan!');
        setIsAddingPorto(false);
        setNewPorto({
          kategori: 'Prestasi', judul_karya: '', tahun: new Date().getFullYear().toString(), deskripsi_singkat: '', link_bukti: ''
        });
        fetchPortofolio();
      } else {
        toast.error('Gagal menambah portofolio');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSavingPorto(false);
    }
  };

  const handleDeletePorto = async (id) => {
    if (!confirm('Hapus portofolio ini?')) return;
    try {
      const res = await fetch(`/api/etoser/portofolio?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Portofolio dihapus');
        setPortofolios(portofolios.filter(p => p.id !== id));
      }
    } catch (error) {
      toast.error('Gagal menghapus');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-12">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-sky-600 via-indigo-600 to-slate-900 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-full border-2 md:border-4 border-white/50 overflow-hidden flex items-center justify-center text-2xl md:text-4xl font-black shadow-lg">
                {profil.foto_profil ? (
                  <img src={profil.foto_profil} alt={profil.name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  (profil.name ? profil.name.charAt(0).toUpperCase() : 'E')
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 md:p-2 bg-white text-sky-600 hover:bg-sky-100 rounded-full shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Unggah Foto Profil"
              >
                <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div>
              <h1 className="text-xl md:text-4xl font-black mb-1 md:mb-2 drop-shadow-sm">{profil.name || 'Etoser'}</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className="bg-white/20 backdrop-blur-md border border-white/40 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wide">
                  {profil.id || 'ETOS'}
                </span>
                <span className="bg-sky-900/40 backdrop-blur-md border border-sky-400/30 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wide text-sky-100 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Fase {profil.fase || 'T0'}
                </span>
                <span className="bg-indigo-900/40 backdrop-blur-md border border-indigo-400/30 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wide text-indigo-50 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Wilayah {profil.wilayah || '-'} (Angkatan {profil.angkatan || '-'})
                </span>
              </div>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleSaveProfil}
            disabled={savingProfil}
            className="w-full md:w-auto justify-center bg-white text-sky-600 hover:bg-sky-50 px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {savingProfil ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
            {savingProfil ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
        
        {/* Decorative blobs */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      {/* Tabs - Hidden on mobile because it's handled by top-left dropdown in header */}
      <div className="hidden md:flex gap-4 border-b border-sky-200">
        <button 
          onClick={() => handleTabChange('profil')}
          className={`pb-4 px-4 font-bold text-lg flex items-center gap-2 transition-all ${activeTab === 'profil' ? 'text-sky-600 border-b-4 border-sky-600' : 'text-sky-900/50 hover:text-sky-600'}`}
        >
          <User className="w-5 h-5" />
          Profil Saya
        </button>
        <button 
          onClick={() => handleTabChange('portofolio')}
          className={`pb-4 px-4 font-bold text-lg flex items-center gap-2 transition-all ${activeTab === 'portofolio' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-sky-900/50 hover:text-indigo-600'}`}
        >
          <Trophy className="w-5 h-5" />
          Portofolio Karya
          {portofolios.length > 0 && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
              {portofolios.length}
            </span>
          )}
        </button>
      </div>

      {/* Profil Tab Content */}
      {activeTab === 'profil' && (
        <form onSubmit={handleSaveProfil}>
          {loadingProfil ? (
            <div className="flex justify-center items-center py-20 text-sky-600">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Info Akademik */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <GraduationCap className="w-32 h-32 text-sky-500" />
                  </div>
                  
                  <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 relative z-10">
                    <div className="p-2.5 md:p-3 bg-sky-100 rounded-xl md:rounded-2xl text-sky-600">
                      <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">Informasi Akademik</h2>
                  </div>

                  <div className="space-y-5 relative z-10">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">Universitas</label>
                      <input 
                        type="text" 
                        name="universitas"
                        value={profil.universitas || ''}
                        onChange={(e) => setProfil({...profil, universitas: e.target.value})}
                        placeholder="Contoh: Universitas Indonesia"
                        className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">Fakultas</label>
                        <input 
                          type="text" 
                          name="fakultas"
                          value={profil.fakultas || ''}
                          onChange={(e) => setProfil({...profil, fakultas: e.target.value})}
                          placeholder="Contoh: MIPA"
                          className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all placeholder:text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">Jurusan</label>
                        <input 
                          type="text" 
                          name="jurusan"
                          value={profil.jurusan || ''}
                          onChange={(e) => setProfil({...profil, jurusan: e.target.value})}
                          placeholder="Contoh: Matematika"
                          className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">Semester Berjalan</label>
                        <input 
                          type="number" 
                          name="semester_berjalan"
                          value={profil.semester_berjalan || ''}
                          onChange={(e) => setProfil({...profil, semester_berjalan: e.target.value})}
                          placeholder="Contoh: 5"
                          className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all placeholder:text-slate-400"
                          min="1" max="14"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">IPK Terakhir</label>
                        <input 
                          type="number" 
                          step="0.01"
                          name="ipk_terakhir"
                          value={profil.ipk_terakhir || ''}
                          onChange={(e) => setProfil({...profil, ipk_terakhir: e.target.value})}
                          placeholder="Contoh: 3.85"
                          className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all placeholder:text-slate-400"
                          min="0" max="4.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Kontak & Alamat */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Phone className="w-32 h-32 text-indigo-500" />
                  </div>
                  
                  <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 relative z-10">
                    <div className="p-2.5 md:p-3 bg-indigo-100 rounded-xl md:rounded-2xl text-indigo-600">
                      <Phone className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">Kontak & Alamat</h2>
                  </div>

                  <div className="space-y-5 relative z-10">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">Nomor WhatsApp / HP</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">+62</span>
                        <input 
                          type="tel" 
                          name="no_hp"
                          value={profil.no_hp || ''}
                          onChange={(e) => setProfil({...profil, no_hp: e.target.value})}
                          placeholder="81234567890"
                          className="w-full pl-14 pr-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">Alamat Domisili</label>
                      <textarea 
                        name="alamat_domisili"
                        value={profil.alamat_domisili || ''}
                        onChange={(e) => setProfil({...profil, alamat_domisili: e.target.value})}
                        rows="4"
                        placeholder="Tuliskan alamat lengkap domisili Anda saat ini..."
                        className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-400 resize-none"
                      ></textarea>
                    </div>
                    
                    <div className="mt-6 bg-sky-50 border border-sky-100 p-4 rounded-xl flex gap-3 text-sky-800">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-sky-600" />
                      <p className="text-sm font-medium">Pastikan nomor handphone aktif dan terhubung dengan WhatsApp untuk mempermudah komunikasi pembinaan.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={savingProfil}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all disabled:opacity-70 active:scale-95"
                >
                  {savingProfil ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Portofolio Tab Content */}
      {activeTab === 'portofolio' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-lg md:text-xl font-bold text-indigo-950">Daftar Portofolio / Prestasi</h3>
            <button 
              onClick={() => setIsAddingPorto(!isAddingPorto)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-sm md:text-base"
            >
              <Plus className="w-5 h-5" />
              {isAddingPorto ? 'Batal Tambah' : 'Tambah Portofolio'}
            </button>
          </div>

          {isAddingPorto && (
            <form onSubmit={handleSavePorto} className="bg-white/80 backdrop-blur-md border-2 border-indigo-200 rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-lg animate-in fade-in zoom-in-95">
              <h4 className="text-base md:text-lg font-bold text-indigo-900 mb-4 md:mb-6">Tambah Portofolio Baru</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-indigo-900">Kategori</label>
                  <select 
                    value={newPorto.kategori}
                    onChange={(e) => setNewPorto({...newPorto, kategori: e.target.value})}
                    className="w-full mt-1 px-3.5 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-white/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Prestasi">Prestasi / Kejuaraan</option>
                    <option value="Organisasi">Organisasi / Kepanitiaan</option>
                    <option value="Karya">Karya / Publikasi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold text-indigo-900">Tahun</label>
                  <input 
                    type="text" 
                    value={newPorto.tahun}
                    onChange={(e) => setNewPorto({...newPorto, tahun: e.target.value})}
                    className="w-full mt-1 px-3.5 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-white/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs sm:text-sm font-bold text-indigo-900">Judul Karya / Prestasi / Jabatan</label>
                  <input 
                    type="text" 
                    required
                    value={newPorto.judul_karya}
                    onChange={(e) => setNewPorto({...newPorto, judul_karya: e.target.value})}
                    className="w-full mt-1 px-3.5 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-white/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Contoh: Juara 1 Lomba Essay Nasional"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs sm:text-sm font-bold text-indigo-900">Deskripsi Singkat</label>
                  <textarea 
                    value={newPorto.deskripsi_singkat}
                    onChange={(e) => setNewPorto({...newPorto, deskripsi_singkat: e.target.value})}
                    className="w-full mt-1 px-3.5 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-white/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none h-20 resize-none"
                    placeholder="Jelaskan peran atau pencapaianmu..."
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs sm:text-sm font-bold text-indigo-900">Link Bukti (Opsional)</label>
                  <input 
                    type="url" 
                    value={newPorto.link_bukti}
                    onChange={(e) => setNewPorto({...newPorto, link_bukti: e.target.value})}
                    className="w-full mt-1 px-3.5 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-white/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  type="submit"
                  disabled={savingPorto}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-70 active:scale-95"
                >
                  {savingPorto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Portofolio
                </button>
              </div>
            </form>
          )}

          {loadingPorto ? (
            <div className="flex justify-center items-center py-20 text-indigo-600">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          ) : portofolios.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl md:rounded-[2rem] p-8 md:p-12 text-center text-indigo-900/50">
              <Trophy className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 opacity-30" />
              <p className="text-base md:text-lg font-bold">Belum ada portofolio</p>
              <p className="text-xs md:text-sm">Tambahkan prestasimu untuk melengkapi profil.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {portofolios.map(porto => (
                <div key={porto.id} className="bg-white/70 backdrop-blur-md border border-indigo-100 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm hover:shadow-md transition-all group relative">
                  
                  <button 
                    onClick={() => handleDeletePorto(porto.id)}
                    className="absolute top-3 right-3 md:top-4 md:right-4 p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-95"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-[10px] md:text-xs rounded-full mb-2 md:mb-3">
                    {porto.kategori}
                  </span>
                  <h4 className="text-base md:text-xl font-bold text-indigo-950 pr-8 leading-snug">{porto.judul_karya}</h4>
                  <p className="text-xs md:text-sm font-bold text-indigo-500 mb-2 md:mb-3">{porto.tahun}</p>
                  
                  {porto.deskripsi_singkat && (
                    <p className="text-xs md:text-sm text-indigo-900/70 mb-3 md:mb-4 line-clamp-3">
                      {porto.deskripsi_singkat}
                    </p>
                  )}

                  {porto.link_bukti && (
                    <a 
                      href={porto.link_bukti}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                    >
                      <LinkIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Lihat Bukti
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
