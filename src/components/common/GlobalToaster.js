"use client";
import { Toaster } from 'react-hot-toast';

export default function GlobalToaster() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        zIndex: 99999999,
        top: 24,
        right: 24,
      }}
      containerClassName="!z-[99999999]"
      toastOptions={{
        duration: 4500,
        className: 'font-sans font-semibold text-xs md:text-sm text-slate-900 rounded-2xl shadow-2xl backdrop-blur-xl bg-white/95 border border-slate-200/80 !z-[99999999] py-3 px-4',
        style: {
          zIndex: 99999999,
        },
      }}
    />
  );
}
