"use client";

import { useState, useEffect, useRef } from 'react';
import { User, Phone, MapPin, GraduationCap, Loader2, Save, BookOpen, AlertCircle, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilFasilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [profilData, setProfilData] = useState({
    id: '',
    name: '',
    role: '',
    fasil_role: '',
    wilayah: '',
    universitas: '',
    fakultas: '',
    jurusan: '',
    semester_berjalan: '',
    ipk_terakhir: '',
    no_hp: '',
    alamat_domisili: '',
    foto_profil: ''
  });

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
        setProfilData(prev => ({ ...prev, foto_profil: base64 }));
        toast.success('Foto berhasil dipilih! Klik "Simpan Profil" untuk menerapkan.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetch('/api/fasil/profil');
        const json = await res.json();
        
        if (json.success) {
          setProfilData(json.data);
        } else {
          toast.error(json.error || 'Gagal mengambil data profil');
        }
      } catch (error) {
        console.error(error);
        toast.error('Terjadi kesalahan koneksi');
      } finally {
        setLoading(false);
      }
    };
    fetchProfil();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfilData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/fasil/profil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profilData)
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success('Profil berhasil disimpan');
      } else {
        toast.error(json.error || 'Gagal menyimpan profil');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-12">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-full border-2 md:border-4 border-white/50 overflow-hidden flex items-center justify-center text-2xl md:text-4xl font-black shadow-lg">
                {profilData.foto_profil ? (
                  <img src={profilData.foto_profil} alt={profilData.name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  (profilData.name ? profilData.name.charAt(0).toUpperCase() : 'F')
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 md:p-2 bg-white text-orange-600 hover:bg-orange-100 rounded-full shadow-md transition-all hover:scale-110"
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
              <h1 className="text-xl md:text-4xl font-black mb-1 md:mb-2 drop-shadow-sm">{profilData.name}</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className="bg-white/20 backdrop-blur-md border border-white/40 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wide">
                  {profilData.id}
                </span>
                <span className="bg-orange-800/40 backdrop-blur-md border border-orange-800/30 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wide text-orange-100 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {profilData.fasil_role}
                </span>
                <span className="bg-amber-400/40 backdrop-blur-md border border-amber-400/30 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wide text-amber-50 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Wilayah {profilData.wilayah}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto justify-center bg-white text-orange-600 hover:bg-orange-50 px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
        
        {/* Decorative blobs */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Info Akademik */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <GraduationCap className="w-32 h-32 text-orange-500" />
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 relative z-10">
            <div className="p-2.5 md:p-3 bg-orange-100 rounded-xl md:rounded-2xl text-orange-600">
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
                value={profilData.universitas || ''}
                onChange={handleChange}
                placeholder="Contoh: Universitas Indonesia"
                className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Fakultas</label>
                <input 
                  type="text" 
                  name="fakultas"
                  value={profilData.fakultas || ''}
                  onChange={handleChange}
                  placeholder="Contoh: MIPA"
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Jurusan</label>
                <input 
                  type="text" 
                  name="jurusan"
                  value={profilData.jurusan || ''}
                  onChange={handleChange}
                  placeholder="Contoh: Matematika"
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Semester Berjalan</label>
                <input 
                  type="number" 
                  name="semester_berjalan"
                  value={profilData.semester_berjalan || ''}
                  onChange={handleChange}
                  placeholder="Contoh: 7"
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">IPK Terakhir</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="ipk_terakhir"
                  value={profilData.ipk_terakhir || ''}
                  onChange={handleChange}
                  placeholder="Contoh: 3.85"
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Kontak & Alamat */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Phone className="w-32 h-32 text-orange-500" />
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 relative z-10">
            <div className="p-2.5 md:p-3 bg-amber-100 rounded-xl md:rounded-2xl text-amber-600">
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
                  value={profilData.no_hp || ''}
                  onChange={handleChange}
                  placeholder="81234567890"
                  className="w-full pl-14 pr-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Alamat Domisili</label>
              <textarea 
                name="alamat_domisili"
                value={profilData.alamat_domisili || ''}
                onChange={handleChange}
                rows="4"
                placeholder="Tuliskan alamat lengkap domisili Anda saat ini..."
                className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all placeholder:text-slate-400 resize-none"
              ></textarea>
            </div>
            
            <div className="mt-6 bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-orange-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-orange-600" />
              <p className="text-sm font-medium">Pastikan nomor handphone aktif dan terhubung dengan WhatsApp untuk mempermudah komunikasi.</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
