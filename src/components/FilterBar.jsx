import React from 'react';

export const FilterBar = ({ options = [], selected = [], onToggle }) => {
  if (!options.length) return null;

  return (
    <div className="flex gap-2 mb-1 overflow-x-auto no-scrollbar">
      {options.map(tag => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle && onToggle(tag)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black border transition-all ${
              active
                ? 'bg-[#108542] text-white border-[#108542]'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  );
};

