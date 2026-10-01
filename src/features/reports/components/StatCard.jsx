export default function StatCard({ title, value, icon, color = 'blue' }) {
  // We'll use a very minimal, KICAP-inspired look.
  return (
    <div className="bg-white rounded-[24px] p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#d94a38]">{title}</p>
        <span className="material-symbols-outlined text-[24px] text-gray-400 font-light">{icon}</span>
      </div>
      <div className="mt-8">
        <p className="text-[3.5rem] leading-none font-black text-[#1d1d1f] tracking-tighter">{value || 0}</p>
      </div>
    </div>
  );
}
