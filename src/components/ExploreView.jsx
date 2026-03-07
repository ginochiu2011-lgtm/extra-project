import React from 'react';
import { ExtraLogo } from './ExtraLogo';
import {
  Search,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

export const ExploreView = ({
  activities,
  activitiesLoading,
  activitiesError,
  exploreFilter,
  setExploreFilter,
  exploreTopicFilter,
  setExploreTopicFilter,
  bumpInterests,
  setSelectedActivity,
  setShowSearch,
  setSearchQuery,
}) => {
  let filtered = exploreFilter === '全部' ? activities : activities.filter(a => a.category === exploreFilter);
  if (exploreTopicFilter) {
    filtered = filtered.filter((a) => {
      const labels = (a.labels || []).map(String);
      const title = String(a.title || '');
      return labels.includes(exploreTopicFilter) || title.includes(exploreTopicFilter);
    });
  }

  return (
    <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-slate-50/30">
      <header className="px-6 pt-14 pb-4 bg-white sticky top-0 z-30 flex justify-between items-center border-b border-slate-50">
        <div className="flex items-center gap-3">
          <ExtraLogo className="w-10 h-10" shadow={false} />
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none mb-1">组局广场</h1>
            <p className="text-[#108542] text-[8px] font-black tracking-widest uppercase opacity-60">
              EXTRA DISCOVERY
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="搜索活动、场地和心愿"
            onClick={() => {
              setShowSearch(true);
              setSearchQuery('');
            }}
            className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            aria-label="查看灵感相册"
            className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 relative"
          >
            <ImageIcon size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
              1
            </span>
          </button>
        </div>
      </header>

      <div className="bg-white sticky top-[108px] z-20">
        <div className="px-6 flex gap-6 overflow-x-auto no-scrollbar py-4 border-b border-slate-50">
          {[
            { label: 'ALL', value: '全部' },
            { label: 'EXTRA ART', value: '非常艺术' },
            { label: 'EXTRA NATURE', value: '非常自然' },
            { label: 'EXTRA SCIENCE', value: '非常科学' },
            { label: 'EXTRA SPORT', value: '非常运动' },
            { label: 'EXTRA CURATION', value: '非常策展' },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setExploreFilter(value)}
              className={`shrink-0 text-[13px] font-black transition-all pb-1 relative ${
                exploreFilter === value ? 'text-[#108542]' : 'text-slate-300'
              }`}
            >
              {label}
              {exploreFilter === value && (
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#108542] rounded-full animate-in slide-in-from-left duration-300"></div>
              )}
            </button>
          ))}
        </div>
        {exploreTopicFilter && (
          <div className="px-6 pb-3 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-black">已按场景筛选：</span>
            <button
              type="button"
              onClick={() => setExploreTopicFilter('')}
              className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-700 flex items-center gap-1"
            >
              <Sparkles size={12} className="text-[#108542]" />
              <span>{exploreTopicFilter}</span>
            </button>
          </div>
        )}
      </div>

      <section className="px-6 py-6 space-y-8">
        {activitiesError && (
          <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
            <p className="text-[10px] font-black text-amber-700">{activitiesError}</p>
          </div>
        )}

        {activitiesLoading ? (
          <div className="space-y-8">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm animate-pulse"
              >
                <div className="h-56 bg-slate-100" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-slate-100 rounded w-5/6" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-slate-100 rounded w-24" />
                    <div className="h-3 bg-slate-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                bumpInterests('view', item.category);
                setSelectedActivity(item);
              }}
              className="group bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={item.cover}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1.5">
                    <Sparkles size={10} className="text-amber-400" />
                    <span className="text-[9px] font-black text-white italic">
                      AI 匹配度 {item.matchScore}%
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-[9px] font-black text白 italic">
                      {item.category === '非常艺术' && 'EXTRA ART'}
                      {item.category === '非常自然' && 'EXTRA NATURE'}
                      {item.category === '非常科学' && 'EXTRA SCIENCE'}
                      {item.category === '非常运动' && 'EXTRA SPORT'}
                      {item.category === '非常策展' && 'EXTRA CURATION'}
                      {(!item.category ||
                        !['非常艺术', '非常自然', '非常科学', '非常运动', '非常策展'].includes(item.category)) &&
                        'EXTRA'}
                    </span>
                  </div>
                </div>
                {item.isOfficial && (
                  <div className="absolute top-4 right-4 bg-[#108542] text-white px-2 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase shadow-lg shadow-green-900/20">
                    Official
                  </div>
                )}
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex gap-2 mb-2">
                    {item.labels.map(l => (
                      <span
                        key={l}
                        className="text-[8px] font-black text-white/80 bg-white/10 px-2 py-0.5 rounded border border-white/20"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-black text-slate-900 leading-tight mb-3 group-hover:text-[#108542] transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.host}`}
                        alt="host"
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                      {item.host}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    {item.statusText && (
                      <span className="text-[9px] font-black text-[#108542] uppercase tracking-tighter whitespace-nowrap">
                        {item.statusText}
                      </span>
                    )}
                    <span className="text-sm font-black italic whitespace-nowrap">
                      {item.price === 0 ? 'FREE' : `¥${item.price}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

