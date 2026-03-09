import React from 'react';
import { Navigation, MapPin, Star } from 'lucide-react';
import MapPlaceView from './MapPlaceView';

export const PlaceView = ({
  places,
  placesLoading,
  placesError,
  isMapView,
  setIsMapView,
  setShowPlaceOnboard,
  activities,
  nearbyParents,
  setSelectedActivity,
  handleContactPlaceOwner,
}) => (
  <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-slate-50 animate-in fade-in duration-300">
    <header className="px-6 pt-14 pb-8 bg-white border-b flex justify-between items-end sticky top-0 z-20">
      <div>
        <h1 className="text-2xl font-black italic mb-1 uppercase tracking-tighter">Energy Spaces</h1>
        <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">
          寻找最契合你画像的高能量空间
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label={isMapView ? '收起地图' : '展开地图查看场地'}
          onClick={() => setIsMapView(!isMapView)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
            isMapView ? 'bg-black text-white border-black' : 'bg-slate-50 text-slate-400 border-slate-100'
          }`}
        >
          <Navigation size={18} />
        </button>
        <button
          type="button"
          aria-label="打开场地主入驻表单"
          onClick={() => setShowPlaceOnboard(true)}
          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all"
        >
          场地主入驻
        </button>
      </div>
    </header>

    {/* 地图功能区域：定位、附近活动/场地/家长、导航 */}
    {isMapView && (
      <div id="place-map-section" className="px-6 mt-6">
        <MapPlaceView
          places={places}
          activities={activities}
          parents={nearbyParents}
          onSelectPlace={() => {}}
          onSelectActivity={(a) => {
            const full = activities.find(x => x.id === a?.id);
            if (full) {
              setSelectedActivity(full);
              return;
            }

            setSelectedActivity({
              id: a?.id ?? Date.now(),
              isOfficial: Boolean(a?.isOfficial),
              tag: a?.tag ?? '精选搭子局',
              category: a?.category ?? '非常自然',
              title: a?.title ?? a?.name ?? '未命名活动',
              host: a?.host ?? '附近家长',
              price: typeof a?.price === 'number' ? a.price : 0,
              capacity: a?.capacity ?? null,
              joined: typeof a?.joined === 'number' ? a.joined : 0,
              lifecycleStatus: a?.lifecycleStatus ?? 'online',
              stats: Array.isArray(a?.stats) && a.stats.length === 5 ? a.stats : [60, 60, 60, 60, 60],
              cover:
                a?.cover ??
                'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
              location: a?.location ?? '未知地点',
              lat: a?.lat,
              lng: a?.lng,
              statusText: a?.statusText ?? '',
              matchScore: typeof a?.matchScore === 'number' ? a.matchScore : 80,
              labels: Array.isArray(a?.labels) ? a.labels : [],
            });
          }}
          onSelectParent={() => {}}
        />
      </div>
    )}

    <div className="px-6 py-6 grid grid-cols-1 gap-6">
      {placesError && (
        <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
          <p className="text-[10px] font-black text-amber-700">{placesError}</p>
        </div>
      )}

      {placesLoading ? (
        [0, 1, 2].map(i => (
          <div
            key={i}
            className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm flex animate-pulse"
          >
            <div className="w-32 h-32 shrink-0 bg-slate-100" />
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
              <div className="flex justify-between items-end">
                <div className="h-3 bg-slate-100 rounded w-24" />
                <div className="h-3 bg-slate-100 rounded w-16" />
              </div>
            </div>
          </div>
        ))
      ) : (
        <>
          {/* 正式发布的场地（官方/精选） */}
          {places
            .filter(p => !p.isOwnerSubmitted && !p.hiddenInPlaceList)
            .map(p => (
              <div
                key={p.id}
                className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm flex active:scale-[0.98] transition-all"
              >
                <div className="w-32 h-32 shrink-0 relative">
                  <img src={p.cover} className="w-full h-full object-cover" alt="place" />
                  {p.ownershipType === 'ENTERPRISE' && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[8px] font-black">
                      官方合作
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1 gap-3">
                      <h4 className="font-black text-sm truncate max-w-[160px] flex items-center gap-1">
                        <span className="truncate">{p.name}</span>
                        {p.hasApplied && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black flex-shrink-0">
                            已申请
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-0.5 text-amber-400 text-[10px] font-black flex-shrink-0">
                        <Star size={10} className="fill-amber-400" />
                        {p.rating}
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter flex items-center gap-1">
                      <MapPin size={10} />
                      {p.distance} · {p.category}
                    </p>
                    {Array.isArray(p.labels) && p.labels.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.labels.slice(0, 3).map(label => (
                          <span
                            key={label}
                            className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black"
                          >
                            #{label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMapView(true);
                        setTimeout(() => {
                          const el = document.getElementById('place-map-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 0);
                      }}
                      className="text-[10px] font-black text-slate-400 underline decoration-slate-200 underline-offset-4"
                    >
                      查看地图
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* 场地主入驻的灵感场地 */}
          {places.some(p => p.isOwnerSubmitted) && (
            <div className="mt-2 mb-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                场地主入驻 · 灵感场地
              </p>
            </div>
          )}
          {places
            .filter(p => p.isOwnerSubmitted && !p.hiddenInPlaceList)
            .map(p => (
              <div
                key={p.id}
                className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm flex active:scale-[0.98] transition-all"
              >
                <div className="w-32 h-32 shrink-0 relative">
                  <img src={p.cover} className="w-full h-full object-cover" alt="place" />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify之间 items-start mb-1 gap-3">
                      <h4 className="font-black text-sm flex items-center gap-1 max-w-[160px]">
                        <span className="truncate">{p.name}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[8px] font-black uppercase flex-shrink-0">
                          BY 场地主
                        </span>
                        {p.hasApplied && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black flex-shrink-0">
                            已申请
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-0.5 text-amber-400 text-[10px] font-black flex-shrink-0">
                        <Star size={10} className="fill-amber-400" />
                        {p.rating}
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter flex items-center gap-1">
                      <MapPin size={10} />
                      {p.address || p.city || '待补充'}
                    </p>
                    {p.suggestedUse && (
                      <p className="mt-1 text-[9px] text-slate-500 font-bold line-clamp-1">
                        {p.suggestedUse}
                      </p>
                    )}
                    {Array.isArray(p.labels) && p.labels.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.labels.slice(0, 3).map(label => (
                          <span
                            key={label}
                            className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black"
                          >
                            #{label}
                          </span>
                        ))}
                      </div>
                    )}
                    {(p.contactName || p.availableSlots) && (
                      <div className="mt-1 p-2 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          入驻信息 · 仅用于合作沟通
                        </p>
                        {p.contactName && (
                          <p className="text-[9px] text-slate-500 font-bold">
                            联系人：{p.contactName}
                          </p>
                        )}
                        {p.availableSlots && (
                          <p className="text-[9px] text-slate-500 font-bold line-clamp-1">
                            可预约时段：{p.availableSlots}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMapView(true);
                        setTimeout(() => {
                          const el = document.getElementById('place-map-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 0);
                      }}
                      className="text-[10px] font-black text-slate-400 underline decoration-slate-200 underline-offset-4"
                    >
                      查看地图
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContactPlaceOwner(p)}
                      className={`text-[10px] font-black px-2 py-1 rounded-xl border transition-all ${
                        p.hasApplied
                          ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
                          : 'text-[#108542] bg-[#108542]/5 border-transparent'
                      }`}
                    >
                      {p.hasApplied ? '已提交合作申请' : '私信场地主'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  </div>
);

