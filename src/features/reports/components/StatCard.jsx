const ACCENTS = {
  amber: 'text-amber-600',
  green: 'text-emerald-600',
  red: 'text-red-600',
  sky: 'text-sky-600',
  indigo: 'text-indigo-600',
};

export default function StatCard({ title, value, icon, accent = 'default', sub = null }) {
  const valueColor = ACCENTS[accent] || 'text-[#1d1d1f]';
  const isText = typeof value === 'string' && value !== '' && Number.isNaN(Number(value));
  return (
    <div className="bg-white rounded-[24px] p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#d94a38] leading-tight">{title}</p>
        <span className="material-symbols-outlined text-[22px] text-gray-300 font-light flex-shrink-0">{icon}</span>
      </div>
      <div className="mt-6">
        <p className={`font-black tracking-tighter ${valueColor} ${isText ? 'text-[1.5rem] leading-tight break-words' : 'text-[2.75rem] leading-none'}`}>
          {value ?? 0}
        </p>
        {sub && <p className="text-[11px] text-gray-500 mt-2">{sub}</p>}
      </div>
    </div>
  );
}
