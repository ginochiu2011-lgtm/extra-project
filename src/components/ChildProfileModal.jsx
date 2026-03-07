import React, { useState } from 'react';

export const ChildProfileModal = ({ initial, onSave }) => {
  const [age, setAge] = useState(initial?.age || '');
  const [gender, setGender] = useState(initial?.gender || '男');
  const [stats, setStats] = useState(initial?.stats || [60, 60, 60, 60, 60]);

  const labels = ['艺术', '自然', '科学', '运动', '策展'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!age || !gender) return;
    onSave({
      age: Number(age),
      gender,
      stats,
    });
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[210] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full rounded-[40px] p-8 animate-in zoom-in-95 duration-300 space-y-6">
        <div>
          <h2 className="text-xl font-black mb-1 italic">完善娃的画像</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            用一次录入，换来更准的推荐
          </p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                娃的年龄
              </label>
              <input
                type="number"
                min="0"
                max="18"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="例如：5"
                className="w-full h-10 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                性别
              </label>
              <div className="flex bg-slate-100 rounded-2xl p-1 text-[10px] font-black uppercase tracking-widest">
                {['男', '女'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-1.5 rounded-xl transition-all ${
                      gender === g ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                兴趣雷达（预选，可微调）
              </p>
              <span className="text-[9px] text-[#108542] font-black">
                {stats.reduce((a, b) => a + b, 0) / stats.length | 0}% 平均
              </span>
            </div>
            <div className="space-y-4">
              {labels.map((label, i) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {label}倾向
                    </span>
                    <span className="text-xs font-black italic">{stats[i]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stats[i]}
                    onChange={e => {
                      const next = [...stats];
                      next[i] = parseInt(e.target.value, 10);
                      setStats(next);
                    }}
                    className="w-full h-1.5 bg-slate-100 rounded-full appearance-none accent-[#108542]"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#108542] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/20 active:scale-95 transition-all"
          >
            保存娃的画像
          </button>
        </form>
      </div>
    </div>
  );
};

