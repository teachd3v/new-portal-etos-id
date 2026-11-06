"use client";
import { Toaster } from 'react-hot-toast';

export default function GlobalToaster() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        zIndex: 99999999,
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        right: 16,
        left: 16,
      }}
      containerClassName="!z-[99999999]"
      toastOptions={{
        duration: 4500,
        className:
          'font-sans font-semibold text-xs md:text-sm text-slate-900 rounded-2xl shadow-2xl backdrop-blur-xl bg-white/95 border border-slate-200/80 !z-[99999999] py-3 px-4 max-w-[92vw] md:max-w-md',
        style: {
          zIndex: 99999999,
        },
      }}
    />
  );
}
