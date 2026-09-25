"use client";
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SystemSettingsTab from '@/components/admin/settings/SystemSettingsTab';
import InstrumenReliTab from '@/components/admin/settings/InstrumenReliTab';
import InstrumenEtoserTab from '@/components/admin/settings/InstrumenEtoserTab';
import InstrumenFasilTab from '@/components/admin/settings/InstrumenFasilTab';
import InstrumenPeerTab from '@/components/admin/settings/InstrumenPeerTab';
import SanksiTab from '@/components/admin/settings/SanksiTab';

function SettingsContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'system';

  useEffect(() => {
    const area = document.getElementById('admin-content-area');
    if (area) {
      area.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  const tabs = [
    { id: 'system', component: SystemSettingsTab },
    { id: 'reli', component: InstrumenReliTab },
    { id: 'fasil', component: InstrumenFasilTab },
    { id: 'etoser', component: InstrumenEtoserTab },
    { id: 'sanksi', component: SanksiTab },
  ];

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
