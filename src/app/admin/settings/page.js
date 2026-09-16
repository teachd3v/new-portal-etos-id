"use client";
import { Suspense, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import SystemSettingsTab from '@/components/admin/settings/SystemSettingsTab';
import InstrumenReliTab from '@/components/admin/settings/InstrumenReliTab';
import InstrumenEtoserTab from '@/components/admin/settings/InstrumenEtoserTab';
import InstrumenFasilTab from '@/components/admin/settings/InstrumenFasilTab';
import InstrumenPeerTab from '@/components/admin/settings/InstrumenPeerTab';
import SanksiTab from '@/components/admin/settings/SanksiTab';
import { Settings, Compass, CheckSquare, Users, UserCheck, AlertTriangle } from 'lucide-react';

function SettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'system';

  useEffect(() => {
    const area = document.getElementById('admin-content-area');
    if (area) {
      area.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  const tabs = [
    { id: 'system', label: 'Sistem & Periode', icon: Settings, component: SystemSettingsTab },
    { id: 'reli', label: 'Instrumen RELI', icon: Compass, component: InstrumenReliTab },
    { id: 'fasil', label: 'Instrumen Fasil', icon: UserCheck, component: InstrumenFasilTab },
    { id: 'etoser', label: 'Instrumen Etoser', icon: CheckSquare, component: InstrumenEtoserTab },
    { id: 'sanksi', label: 'Katalog Sanksi', icon: AlertTriangle, component: SanksiTab },
  ];

  const handleTabChange = (tabId) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('tab', tabId);
    router.replace(`${pathname}?${current.toString()}`, { scroll: false });
  };

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || SystemSettingsTab;

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="pt-2 md:pt-4 pb-2 md:pb-4 border-b border-teal-900/10">
        <h1 className="text-2xl md:text-4xl font-black text-teal-950 tracking-tight">Pengaturan & Monev</h1>
        <p className="hidden md:block text-teal-800/70 font-medium text-base md:text-lg mt-1">
          Kelola instrumen penilaian, periode asesmen, dan sanksi pembinaan.
        </p>
      </div>

      {/* Segmented Sub-Tab Switcher Pills */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-800 text-white shadow-md shadow-teal-900/15'
                  : 'bg-white/60 hover:bg-white text-teal-900/70 hover:text-teal-950 border border-teal-200/60 shadow-xs'
              }`}
            >
              <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="pt-2">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div>Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
