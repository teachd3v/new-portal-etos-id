import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title = "Konfirmasi Aksi", message = "Apakah Anda yakin ingin melanjutkan aksi ini?", confirmText = "Ya, Lanjutkan", cancelText = "Batal", isDestructive = true }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-950/30 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95 duration-300 cursor-default">
        <div className={"w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner " + (isDestructive ? 'bg-rose-100' : 'bg-amber-100')}>
          <AlertTriangle className={"w-8 h-8 " + (isDestructive ? 'text-rose-600' : 'text-amber-600')} />
        </div>
        
        <h3 className="text-2xl font-black text-teal-950 mb-2">{title}</h3>
        <p className="text-teal-800/80 font-medium mb-8">
          {message}
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 bg-white hover:bg-teal-50 text-teal-900 font-bold py-3 rounded-xl transition-all shadow-sm border border-teal-100"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={"flex-1 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg " + (isDestructive ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
