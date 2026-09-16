import { Loader2 } from 'lucide-react';

const COLOR_MAP = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', glow: 'bg-teal-500' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', glow: 'bg-sky-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', glow: 'bg-blue-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', glow: 'bg-indigo-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', glow: 'bg-orange-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', glow: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', glow: 'bg-emerald-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', glow: 'bg-rose-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', glow: 'bg-purple-500' },
};

export default function StatCard({ 
  title, 
  value, 
  unit = '', 
  icon: Icon, 
  color = 'teal', 
  colorClass = '', 
  loading = false, 
  onClick 
}) {
  // Normalize color key
  let resolvedColor = color;
  if (!COLOR_MAP[resolvedColor] && colorClass) {
    if (colorClass.includes('teal')) resolvedColor = 'teal';
    else if (colorClass.includes('sky')) resolvedColor = 'sky';
    else if (colorClass.includes('blue')) resolvedColor = 'blue';
    else if (colorClass.includes('indigo')) resolvedColor = 'indigo';
    else if (colorClass.includes('rose')) resolvedColor = 'rose';
    else if (colorClass.includes('amber')) resolvedColor = 'amber';
    else if (colorClass.includes('emerald')) resolvedColor = 'emerald';
    else if (colorClass.includes('orange')) resolvedColor = 'orange';
    else resolvedColor = 'teal';
  }
  const theme = COLOR_MAP[resolvedColor] || COLOR_MAP.teal;

  const baseClass = "relative overflow-hidden bg-white/60 backdrop-blur-md border border-white/80 p-3.5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-all group ";
  const activeClass = onClick ? 'cursor-pointer hover:-translate-y-1 ' : '';

  return (
    <div onClick={onClick} className={baseClass + activeClass}>
      {/* Subtle background glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-15 ${theme.glow} pointer-events-none`}></div>

      {/* Top Icon Badge */}
      {Icon && (
        <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-2.5 md:mb-4 ${theme.bg} ${theme.text} transition-transform group-hover:scale-110 shadow-sm`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      )}

      {/* Metric Label */}
      <p className="text-slate-500 font-bold text-xs md:text-sm mb-0.5 md:mb-1 line-clamp-1">{title}</p>

      {/* Metric Value + Unit */}
      <div className="flex items-baseline gap-1.5 md:gap-2">
        {loading ? (
          <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-slate-400 my-1" />
        ) : (
          <>
            <h3 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
            {unit && <span className="text-xs md:text-sm font-bold text-slate-400">{unit}</span>}
          </>
        )}
      </div>
    </div>
  );
}
