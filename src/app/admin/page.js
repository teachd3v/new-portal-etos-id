"use client";
import EtoserTab from "@/components/admin/dashboard/EtoserTab";
import FasilTab from "@/components/admin/dashboard/FasilTab";
import MonitoringBulananEtoser from "@/components/admin/dashboard/MonitoringBulananEtoser";
import MonitoringBulananFasil from "@/components/admin/dashboard/MonitoringBulananFasil";
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AdminDashboard({ searchParams }) {
  return (
    <Suspense fallback={<div className="p-8">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'etoser';

  useEffect(() => {
    const area = document.getElementById('admin-content-area');
    if (area) {
      area.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 py-2 md:py-6 pb-20">
      
      {/* Executive Hero Banner */}
      <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-slate-900 rounded-2xl md:rounded-[2.5rem] p-3.5 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase text-teal-200 bg-teal-950/60 border border-teal-400/30 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full inline-block mb-1 md:mb-3">
              Admin Pusat
            </span>
            <h1 className="text-xl md:text-4xl font-black drop-shadow-sm flex items-center gap-2 md:gap-3">
              <span className="md:hidden">Dashboard</span>
              <span className="hidden md:inline">Dashboard Monitoring & Analitik</span>
            </h1>
            <p className="hidden md:block text-teal-100/90 font-medium text-base md:text-lg max-w-2xl mt-2">
              Pusat kendali pantauan performa Etoser dan Fasilitator secara komprehensif di seluruh wilayah binaan.
            </p>
          </div>
          
          {/* Status Portal (Desktop Only) */}
          <div className="hidden md:flex bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/30 flex items-center justify-center text-teal-200">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-teal-200 font-bold uppercase tracking-wider">Status Portal</p>
              <p className="text-lg font-black text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sistem Aktif
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative blur elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-400 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-400 opacity-10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'etoser' && <EtoserTab />}
        {activeTab === 'etoser-bulanan' && <MonitoringBulananEtoser />}
        {activeTab === 'fasil-bulanan' && <MonitoringBulananFasil />}
        {activeTab === 'fasil' && <FasilTab />}
      </div>
    </div>
  );
}
