"use client";

import { useState, useEffect, useRef } from 'react';
import {
  User,
  Phone,
  MapPin,
  GraduationCap,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Camera,
  Briefcase,
  Mail,
  Globe,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const INDUSTRY_OPTIONS = [
  'Pendidikan & Akademisi',
  'Konsultan & Jasa Profesional',
  'Korporasi / BUMN / Swasta',
  'Teknologi & Digital',
  'Keuangan & Perbankan',
  'Sosial / NGO / Filantropi',
  'Pemerintahan / Publik',
  'Kesehatan & Psikologi',
  'Wirausaha / Bisnis',
  'Lainnya',
];

const EXPERIENCE_OPTIONS = [
  '< 1 Tahun',
  '1–3 Tahun',
  '3–5 Tahun',
  '5–10 Tahun',
  '> 10 Tahun',
];

const EDUCATION_LEVEL_OPTIONS = ['D4 / S1', 'Profesi', 'S2', 'S3'];

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
    profesi: '',
    instansi: '',
    sektor_industri: '',
    pengalaman_tahun: '',
    bio_profesional: '',
    pendidikan_terakhir: '',
    universitas: '',
    jurusan: '',
    no_hp: '',
    email_profesional: '',
    linkedin_url: '',
    alamat_domisili: '',
    foto_profil: '',
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
        setProfilData((prev) => ({ ...prev, foto_profil: base64 }));
        toast.success('Foto dipilih! Klik "Simpan Perubahan" di bawah untuk menerapkan.');
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
          setProfilData((prev) => ({ ...prev, ...json.data }));
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
    setProfilData((prev) => ({ ...prev, [name]: value }));
  };

  const mandatoryFields = [
    profilData.profesi,
    profilData.instansi,
    profilData.sektor_industri,
    profilData.pengalaman_tahun,
    profilData.pendidikan_terakhir,
    profilData.universitas,
    profilData.jurusan,
    profilData.no_hp,
    profilData.email_profesional,
    profilData.alamat_domisili,
  ];
  const filledMandatoryCount = mandatoryFields.filter((v) => String(v || '').trim() !== '').length;
  const isProfileIncomplete = filledMandatoryCount < mandatoryFields.length;

  const handleSave = async (e) => {
    e.preventDefault();
    if (isProfileIncomplete) {
      toast.error('Mohon lengkapi seluruh kolom bertanda bintang (*).');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/fasil/profil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profilData),
      });
      const json = await res.json();

      if (json.success) {
        toast.success('Profil profesional berhasil disimpan');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('fasil-profile-updated'));
        }
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
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="max-w-[1200px] mx-auto space-y-5 md:space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-12"
    >
      {/* Header Identity Card */}
      <div className="bg-gradient-to-br from-[#7C2D12] via-[#9A3412] to-[#C2410C] rounded-2xl md:rounded-[2.25rem] p-4 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3.5 md:gap-6 min-w-0">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 md:w-22 md:h-22 bg-white/15 backdrop-blur-md rounded-full border-2 md:border-4 border-white/50 overflow-hidden flex items-center justify-center text-2xl md:text-3xl font-black shadow-lg">
                {profilData.foto_profil ? (
                  <img
                    src={profilData.foto_profil}
                    alt={profilData.name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : profilData.name ? (
                  profilData.name.charAt(0).toUpperCase()
                ) : (
                  'F'
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 md:p-2 bg-white text-orange-700 hover:bg-orange-50 rounded-full shadow-md transition-all cursor-pointer"
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

            <div className="min-w-0">
              <h1 className="text-lg md:text-3xl font-black tracking-tight truncate">
                {profilData.name}
              </h1>
              {(profilData.profesi || profilData.instansi) && (
                <p className="text-xs md:text-sm text-orange-100 font-semibold truncate mt-0.5">
                  {[profilData.profesi, profilData.instansi].filter(Boolean).join(' • ')}
                </p>
              )}
              <div className="flex flex-nowrap items-center gap-1.5 mt-1.5 overflow-x-auto">
                <span className="bg-black/25 border border-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                  {profilData.id}
                </span>
                <span className="bg-black/25 border border-amber-200/25 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-100 inline-flex items-center gap-1 shrink-0">
                  <User className="w-2.5 h-2.5" />
                  <span>{profilData.fasil_role || 'Fasilitator'}</span>
                </span>
                <span className="bg-black/25 border border-orange-200/25 px-2 py-0.5 rounded-full text-[10px] font-bold text-orange-50 inline-flex items-center gap-1 shrink-0">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{profilData.wilayah}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0">
            {isProfileIncomplete ? (
              <div className="inline-flex items-center gap-2 bg-black/30 border border-amber-300/40 px-3.5 py-2 rounded-xl text-amber-100 text-xs font-bold w-full md:w-auto justify-center">
                <AlertCircle className="w-4 h-4 text-amber-200 shrink-0" />
                <span>
                  Lengkapi Profil Profesionalmu ({filledMandatoryCount}/{mandatoryFields.length})
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-black/25 border border-emerald-300/40 px-3.5 py-2 rounded-xl text-emerald-100 text-xs font-bold w-full md:w-auto justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Profil Profesional Lengkap</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute -right-12 -top-12 w-72 h-72 bg-amber-300/15 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* CARD A: KARIER PROFESIONAL */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm space-y-4 md:space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 bg-orange-100 rounded-xl text-orange-700 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base md:text-xl font-black text-slate-900">
              Karier Profesional
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Informasi pekerjaan utama dan pengalaman Anda sebagai mitra program.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
          <div>
            <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
              Posisi / Profesi Saat Ini <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="profesi"
              value={profilData.profesi || ''}
              onChange={handleChange}
              placeholder="Contoh: Management Consultant / Guru SMA / HR Manager"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
              Instansi / Perusahaan Tempat Bekerja <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="instansi"
              value={profilData.instansi || ''}
              onChange={handleChange}
              placeholder="Contoh: PT Paragon Technology / SMAN 1 Ambon"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
              Sektor / Bidang Industri <span className="text-rose-500">*</span>
            </label>
            <select
              name="sektor_industri"
              value={profilData.sektor_industri || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            >
              <option value="" className="text-xs">Pilih Sektor Industri...</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="text-xs">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
              Lama Pengalaman Profesional <span className="text-rose-500">*</span>
            </label>
            <select
              name="pengalaman_tahun"
              value={profilData.pengalaman_tahun || ''}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            >
              <option value="" className="text-xs">Pilih Rentang Pengalaman...</option>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="text-xs">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio Profesional */}
        <div>
          <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
            Ringkasan Profesional Singkat (Bio)
          </label>
          <textarea
            name="bio_profesional"
            value={profilData.bio_profesional || ''}
            onChange={handleChange}
            rows={3}
            placeholder="Ceritakan secara ringkas latar belakang profesional, fokus karier, dan peran pendampingan Anda..."
            className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400 resize-none"
          />
        </div>
      </div>

      {/* GRID BAWAH: CARD B (PENDIDIKAN TERAKHIR) & CARD C (KONTAK & JEJARING) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-7">
        {/* CARD B: PENDIDIKAN TERAKHIR */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm space-y-4 md:space-y-5 flex flex-col justify-between">
          <div className="space-y-3.5 md:space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base md:text-xl font-black text-slate-900">
                  Pendidikan Terakhir
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Kredensial akademik tertinggi yang telah ditempuh.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
                Jenjang Pendidikan Terakhir <span className="text-rose-500">*</span>
              </label>
              <select
                name="pendidikan_terakhir"
                value={profilData.pendidikan_terakhir || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option value="" className="text-xs">Pilih Jenjang Pendidikan...</option>
                {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="text-xs">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
                Perguruan Tinggi / Almamater <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="universitas"
                value={profilData.universitas || ''}
                onChange={handleChange}
                placeholder="Contoh: Universitas Gadjah Mada"
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
                Bidang Studi / Jurusan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="jurusan"
                value={profilData.jurusan || ''}
                onChange={handleChange}
                placeholder="Contoh: Psikologi Industri & Organisasi"
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* CARD C: KONTAK & JEJARING PROFESIONAL */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm space-y-4 md:space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-orange-100 rounded-xl text-orange-700 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-xl font-black text-slate-900">
                Kontak & Jejaring Profesional
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Saluran komunikasi resmi mitra & profil profesional.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-4">
            <div>
              <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                  +62
                </span>
                <input
                  type="tel"
                  name="no_hp"
                  value={profilData.no_hp || ''}
                  onChange={handleChange}
                  placeholder="81234567890"
                  className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
                Email Profesional / Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email_profesional"
                  value={profilData.email_profesional || ''}
                  onChange={handleChange}
                  placeholder="nama@instansi.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
              Tautan LinkedIn / Web Portfolio <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                name="linkedin_url"
                value={profilData.linkedin_url || ''}
                onChange={handleChange}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">
              Domisili Saat Ini <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="alamat_domisili"
              value={profilData.alamat_domisili || ''}
              onChange={handleChange}
              rows={2}
              placeholder="Kota & alamat domisili Anda saat ini..."
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-[11px] md:placeholder:text-xs placeholder:text-slate-400 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Single Primary Save Action */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto justify-center bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-3.5 rounded-xl md:rounded-2xl text-sm font-black transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.99]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Profil Profesional'}</span>
        </button>
      </div>
    </form>
  );
}
