import React from 'react';

export const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#108542] scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
    {icon}
    <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
  </button>
);

