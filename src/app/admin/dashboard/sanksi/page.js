"use client";
import MonitoringSanksiEtoser from "@/components/admin/dashboard/MonitoringSanksiEtoser";

export default function DaftarSanksiPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-5 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 py-2 md:py-6 pb-20">
      <div>
        <h1 className="text-xl md:text-3xl font-black text-teal-950 tracking-tight">Daftar Penerima Sanksi</h1>
        <p className="text-teal-800/70 font-medium text-xs md:text-sm mt-0.5">
          Monitoring Etoser yang mendapatkan sanksi disipliner dan pemotongan credit point bulanan.
        </p>
      </div>
      <MonitoringSanksiEtoser />
    </div>
  );
}
