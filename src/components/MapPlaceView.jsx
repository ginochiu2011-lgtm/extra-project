import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Users, Compass, Loader2 } from 'lucide-react';
import { loadAMap, hasAMapKey } from '../utils/amap';

const MODES = [
  { key: 'places', label: '附近场地', icon: MapPin },
  { key: 'activities', label: '附近活动', icon: Compass },
  { key: 'parents', label: '附近家长', icon: Users },
];

const MapPlaceView = ({
  places = [],
  activities = [],
  parents = [],
  onSelectPlace,
  onSelectActivity,
  onSelectParent,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const geolocationRef = useRef(null);
  const [mode, setMode] = useState('places');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPos, setUserPos] = useState(null);
  const [selected, setSelected] = useState(null);

  const defaultCenter = [116.397428, 39.90923];

  const clearMarkers = () => {
    markersRef.current.forEach(m => m && m.setMap && m.setMap(null));
    markersRef.current = [];
  };

  const addMarkers = (list, type, icon, onClick) => {
    if (!mapRef.current || !window.AMap) return;
    list
      .filter(item => item.lng != null && item.lat != null)
      .forEach(item => {
        const marker = new window.AMap.Marker({
          position: [item.lng, item.lat],
          title: item.name,
          map: mapRef.current,
        });
        marker.on('click', () => {
          setSelected({ ...item, type });
          onClick?.(item);
        });
        markersRef.current.push(marker);
      });
  };

  const doLocate = () => {
    if (!geolocationRef.current || !mapRef.current) return;
    geolocationRef.current.getCurrentPosition((status, result) => {
      if (status === 'complete') {
        const { lng, lat } = result.position;
        setUserPos({ lng, lat });
        mapRef.current.setCenter([lng, lat]);
        mapRef.current.setZoom(15);
      } else {
        setError('定位失败，请检查权限或网络');
        mapRef.current.setCenter(defaultCenter);
      }
    });
  };

  const doNavigate = (item) => {
    if (!item?.lng || !item?.lat) return;
    const url = `https://uri.amap.com/navigation?to=${item.lng},${item.lat},${encodeURIComponent(item.name || '')}&mode=walking`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (!hasAMapKey()) {
      setError('请在 .env 中配置 VITE_AMAP_KEY');
      setLoading(false);
      return;
    }

    loadAMap()
      .then(AMap => {
        if (!containerRef.current) return;
        const map = new AMap.Map(containerRef.current, {
          zoom: 14,
          center: defaultCenter,
        });
        mapRef.current = map;

        const geo = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        geo.getCurrentPosition((status, result) => {
          if (status === 'complete') {
            const { lng, lat } = result.position;
            setUserPos({ lng, lat });
            map.setCenter([lng, lat]);
          }
        });
        geolocationRef.current = geo;

        setLoading(false);
      })
      .catch(e => {
        setError(e.message || '地图加载失败');
        setLoading(false);
      });

    return () => {
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    clearMarkers();
    if (mode === 'places') addMarkers(places, 'place', MapPin, onSelectPlace);
    else if (mode === 'activities') addMarkers(activities, 'activity', Compass, onSelectActivity);
    else addMarkers(parents, 'parent', Users, onSelectParent);
  }, [mode, places, activities, parents]);

  if (error) {
    return (
      <div className="w-full h-[320px] rounded-2xl bg-slate-100 flex flex-col items-center justify-center gap-3 p-6">
        <p className="text-sm font-bold text-slate-500">{error}</p>
        <p className="text-[10px] text-slate-400">在项目根目录创建 .env 并添加 VITE_AMAP_KEY=你的高德Key</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute top-3 left-3 right-3 flex gap-2 z-20">
        {MODES.map(m => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${
                mode === m.key ? 'bg-[#108542] text-white shadow-lg' : 'bg-white/95 text-slate-600'
              }`}
            >
              <Icon size={14} />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex gap-2 z-20">
        <button
          onClick={doLocate}
          className="flex-1 py-2.5 rounded-xl bg-white/95 text-slate-700 text-xs font-black flex items-center justify-center gap-2 shadow-md"
        >
          <MapPin size={16} />
          定位
        </button>
        {selected && (
          <button
            onClick={() => doNavigate(selected)}
            className="flex-1 py-2.5 rounded-xl bg-[#108542] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md"
          >
            <Navigation size={16} />
            导航
          </button>
        )}
      </div>

      {selected && (
        <div className="absolute bottom-16 left-3 right-3 p-3 rounded-xl bg-white/95 shadow-lg z-20">
          <p className="text-xs font-black text-slate-800 truncate">{selected.name}</p>
          <p className="text-[10px] text-slate-500">{selected.address || selected.location}</p>
        </div>
      )}
    </div>
  );
};

export default MapPlaceView;
