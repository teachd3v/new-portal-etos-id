"use client";
import { useEffect, useState } from 'react';
import { Users, FileCheck2, ClipboardCheck, TrendingUp, Calendar, ArrowRight, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function FasilDashboard() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resUser = await fetch('/api/auth/me');
        if (resUser.ok) {
          const dataUser = await resUser.json();
          setUser(dataUser);
        }

        const resDash = await fetch('/api/fasil/dashboard');
        if (resDash.ok) {
          const dataDash = await resDash.json();
          if (dataDash.success) setDashboardData(dataDash);
        }
      } catch (err) {
        console.error("Gagal load data dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 py-2 md:py-4 pb-20">
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block text-[10px] md:text-xs font-black tracking-widest uppercase text-orange-200 bg-orange-950/60 border border-orange-400/30 px-2.5 py-0.5 rounded-full mb-1.5 md:mb-2">
            Fasilitator
          </span>
          <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 drop-shadow-sm">
            <span className="md:hidden">Dashboard</span>
            <span className="hidden md:inline">Halo, Kak {user?.name || 'Fasilitator'}! 👋</span>
          </h1>
          <p className="hidden md:block text-orange-100 font-medium text-base md:text-lg max-w-xl">
            Selamat datang di Portal Fasilitator. Pantau perkembangan, presensi, dan lakukan penilaian untuk Etoser binaanmu.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute right-20 bottom-0 w-64 h-64 bg-amber-400 opacity-20 rounded-full blur-3xl translate-y-1/3"></div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
           <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[
              { title: "Total Binaan", mobileTitle: "Binaan", value: dashboardData?.stats?.totalBinaan || "0", unit: "Etoser", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
              { title: "Presensi Bulan Ini", mobileTitle: "Presensi", value: dashboardData?.stats?.presensiBulanIni || "0", unit: "%", icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-50" },
              { title: "Asesmen RELI Binaan", mobileTitle: "RELI Binaan", value: dashboardData?.stats?.peerCompleted || "0", unit: `/${dashboardData?.stats?.totalBinaan || 0}`, icon: ClipboardCheck, color: "text-amber-500", bg: "bg-amber-50" },
              { title: "Rata-rata Skor RELI", mobileTitle: "Rata RELI", value: dashboardData?.stats?.rataSkor || "-", unit: "/ 4.00", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" }
            ].map((stat, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-md border border-white/80 p-3.5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 md:mb-4 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <p className="text-slate-500 font-bold text-xs md:text-sm mb-0.5 md:mb-1 line-clamp-1">
                  <span className="md:hidden">{stat.mobileTitle}</span>
                  <span className="hidden md:inline">{stat.title}</span>
                </p>
                <div className="flex items-baseline gap-1.5 md:gap-2">
                  <h3 className="text-xl md:text-3xl font-black text-slate-800">{stat.value}</h3>
                  <span className="text-[11px] md:text-sm font-bold text-slate-400">{stat.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Task List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/60 backdrop-blur-md border border-white/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm">
                <h3 className="text-base md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Tugas & Prioritas</h3>
                <div className="space-y-3 md:space-y-4">
                  {dashboardData?.tasks?.map((task, i) => (
                    <Link
                      key={i}
                      href={task.link || '/fasil/penilaian'}
                      scroll={false}
                      className="flex items-center justify-between p-3.5 md:p-4 bg-white border border-slate-100 rounded-xl md:rounded-2xl hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors shrink-0">
                          {task.icon === "FileCheck2" && <FileCheck2 className="w-4 h-4 md:w-5 md:h-5" />}
                          {task.icon === "ClipboardCheck" && <ClipboardCheck className="w-4 h-4 md:w-5 md:h-5" />}
                          {task.icon === "Users" && <Users className="w-4 h-4 md:w-5 md:h-5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 group-hover:text-orange-600 transition-colors text-xs md:text-sm">{task.title}</h4>
                          <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-medium text-slate-400 mt-0.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{task.type}</span>
                            <span>Tenggat: {task.deadline}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                        <span className={`px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-bold rounded-lg ${
                          task.status.includes('Selesai') ? 'bg-emerald-100 text-emerald-600' : 
                          task.status.includes('Proses') ? 'bg-amber-100 text-amber-600' : 
                          'bg-rose-100 text-rose-600'
                        }`}>
                          {task.status}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                  {(!dashboardData?.tasks || dashboardData.tasks.length === 0) && (
                    <p className="text-slate-500 text-center py-4 font-medium text-xs">Tidak ada tugas saat ini.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Recent Activity */}
            <div className="space-y-6">
              <div className="bg-white/60 backdrop-blur-md border border-white/80 p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm">
                <h3 className="text-base md:text-xl font-bold text-slate-800 mb-4 md:mb-6 flex items-center justify-between">
                  <span>Aktivitas Terbaru</span>
                  <span className="text-[10px] md:text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                    Live History
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {dashboardData?.activities?.map((act, i) => (
                    <div key={act.id || i} className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 hover:border-orange-200 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{act.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{act.description}</p>
                        <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                          {act.timestamp ? new Date(act.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(!dashboardData?.activities || dashboardData.activities.length === 0) && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">Belum Ada Riwayat Aktivitas</p>
                      <p className="text-xs text-slate-400 mt-1">Aktivitas penilaian dan presensi Anda akan tercatat di sini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
