import React, { useState } from 'react';

export const UserProfileModal = ({ profile, onSave, onClose }) => {
  const [stats, setStats] = useState(profile.stats);
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[180] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full rounded-[40px] p-8 animate-in zoom-in-95 duration-300">
        <h2 className="text-xl font-black mb-2 italic">重塑您的能量画像</h2>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-8">根据最近的兴趣偏好动态调整</p>
        <div className="space-y-6 mb-10">
          {['艺术', '自然', '科学', '运动', '策展'].map((label, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest">{label}倾向</span>
                <span className="text-xs font-black italic">{stats[i]}%</span>
              </div>
              <input
                type="range"
                value={stats[i]}
                onChange={e => {
                  const next = [...stats];
                  next[i] = parseInt(e.target.value);
                  setStats(next);
                }}
                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none accent-[#108542]"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">取消</button>
          <button onClick={() => onSave(stats)} className="flex-2 px-8 py-4 bg-[#108542] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/20">保存画像</button>
        </div>
      </div>
    </div>
  );
};

