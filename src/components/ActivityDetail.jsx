import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, MapPin, Navigation, Share2, Sparkles } from 'lucide-react';
import { RadarChart } from './RadarChart';

export const ActivityDetail = ({
  activity,
  onBack,
  token,
  onJoin,
  currentUserId,
  onContactVenue,
  onCheckInSuccess,
  userLocation,
  onRefetchLocation,
  onCancelActivity,
}) => {
  const [detail, setDetail] = useState(activity);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(Boolean(activity?.hasJoinedByMe));
  const [participants, setParticipants] = useState(0);
  const [message, setMessage] = useState('');
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [checkinStatus, setCheckinStatus] = useState('idle');
  const [distanceMeters, setDistanceMeters] = useState(null);
  const isHost = Boolean(currentUserId && activity && activity.ownerId && activity.ownerId === currentUserId);
  const venueType = (detail.venueType || activity.venueType || 'PUBLIC').toUpperCase();

  useEffect(() => {
    // 如果外部 activity 标记了已经报名，同步本地 joined 状态，避免重复报名
    if (activity?.hasJoinedByMe) {
      setJoined(true);
    }
  }, [activity?.hasJoinedByMe, activity?.id]);

  useEffect(() => {
    let active = true;
    const fakeDelay = (ms) => new Promise(res => setTimeout(res, ms));

    const fetchFromApi = async () => {
      setLoading(true);
      setMessage('');
      try {
        const res = await fetch(`/api/activities/${activity.id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const bodyText = await res.text().catch(() => '');
          const details = bodyText ? `：${bodyText.slice(0, 200)}` : '';
          throw new Error(`HTTP ${res.status}${details}`);
        }
        const apiData = await res.json();
        if (!active) return;
        setDetail(apiData);
        setParticipants(apiData.participants || 0);
        setLoading(false);
        return;
      } catch (err) {
        await fakeDelay(500);
        const reason = err instanceof Error ? err.message : String(err);
        if (active) {
          setMessage(`活动详情加载失败（${reason}），已展示演示数据。`);
        }
        const apiData = {
          ...activity,
          participants: typeof activity.joined === 'number'
            ? activity.joined
            : activity.id === 0
              ? 1290
              : activity.id === 3
                ? 3
                : 3,
          capacity: activity.capacity ?? (activity.id === 0 ? 5000 : 3),
          lifecycleStatus: activity.lifecycleStatus || 'online',
          comments: [
            {
              id: 1,
              user: '李漫漫',
              time: '昨天',
              text: '上次一起参加摄影局收获满满，小朋友玩得也很开心！',
            },
            {
              id: 2,
              user: '陈小希',
              time: '2 天前',
              text: '活动节奏安排得很好，不卷又有深度，期待后续系列～',
            },
          ],
        };
        if (!active) return;
        setDetail(apiData);
        setParticipants(apiData.participants);
        setLoading(false);
      }
    };

    fetchFromApi();
    return () => {
      active = false;
    };
  }, [activity, token]);

  useEffect(() => {
    if (!userLocation) return;
    if (!detail.lat || !detail.lng) return;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(detail.lat - userLocation.lat);
    const dLng = toRad(detail.lng - userLocation.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLocation.lat)) *
        Math.cos(toRad(detail.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const EARTH_RADIUS_KM = 6371;
    const d = EARTH_RADIUS_KM * c;
    setDistanceMeters(Math.round(d * 1000));
  }, [userLocation?.lat, userLocation?.lng, detail.lat, detail.lng]);

  const handleJoin = () => {
    if (isHost) {
      setMessage('你是本局的发起人，无需报名。');
      return;
    }

    if (!token) {
      setMessage('请先登录后再报名参加该活动。');
      return;
    }
    if (joined) return;

    if (detail.lifecycleStatus === 'finished' || detail.lifecycleStatus === 'canceled') {
      setMessage('活动已结束或已取消，无法报名。');
      return;
    }

    const rawCap = detail.capacity;
    const cap = Number.isFinite(rawCap) && rawCap > 0 ? rawCap : Infinity;
    if (participants >= cap || detail.lifecycleStatus === 'full') {
      setJoined(true);
      setMessage('名额已满，你已加入候补列表示例，目前无需支付费用，一旦有名额我们会提醒你完成支付（Demo）。');
      return;
    }

    setJoined(true);
    setParticipants(prev => prev + 1);
    const basePrice = Number.isFinite(detail.price) ? detail.price : 0;
    const insuranceFee = includeInsurance ? 5 : 0;
    const total = basePrice + insuranceFee;
    setMessage(
      total > 0
        ? `报名成功，预计费用合计 ¥${total}（含基础活动费 ¥${basePrice}${includeInsurance ? ' + 保险代购 ¥5' : ''}）。稍后将为你弹出模拟支付窗口（Demo）。`
        : `报名成功，已为你锁定席位${includeInsurance ? '（含 Demo 保险代购 ¥5）' : ''}。`
    );
    if (onJoin) {
      onJoin(activity, {
        includeInsurance,
        insuranceFee,
        totalFee: total,
      });
    }
  };

  const handleCheckIn = () => {
    if (venueType === 'COMMERCIAL') return;
    if (!navigator.geolocation) {
      setMessage('当前环境不支持定位打卡，请手动确认现场参与情况。');
      return;
    }
    if (!detail.lat || !detail.lng) {
      setMessage('当前活动未配置精确坐标，无法进行 LBS 打卡（Demo）。');
      return;
    }
    setCheckinStatus('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const toRad = (deg) => (deg * Math.PI) / 180;
        const dLat = toRad(detail.lat - latitude);
        const dLng = toRad(detail.lng - longitude);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(latitude)) *
            Math.cos(toRad(detail.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const EARTH_RADIUS_KM = 6371;
        const d = EARTH_RADIUS_KM * c;
        const meters = d * 1000;

        if (meters <= 100) {
          setCheckinStatus('success');
          setMessage(`打卡成功（Demo），当前距离活动坐标约 ${Math.round(meters)} 米。`);
          if (onCheckInSuccess) {
            onCheckInSuccess(detail, { distanceMeters: meters });
          }
        } else {
          setCheckinStatus('far');
          setMessage(`打卡失败（Demo），你距离活动地点约 ${Math.round(meters)} 米，请靠近后重试。`);
        }
      },
      () => {
        setCheckinStatus('error');
        setMessage('定位失败，暂时无法完成打卡（Demo）。');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="absolute inset-0 bg-white z-[60] overflow-y-auto pb-32 no-scrollbar animate-in slide-in-from-right duration-300">
      <div className="relative h-96">
        <div className="absolute top-12 left-4 right-4 flex justify-between z-10">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <button className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white active:scale-90 transition-all">
            <Share2 size={20} />
          </button>
        </div>
        <img src={detail.cover} className="w-full h-full object-cover" alt="activity" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
      </div>
      <div className="px-6 pt-6 relative z-10">
        <div className="flex gap-2 mb-2">
          <span className="px-3 py-1 bg-[#108542] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/10">
            {detail.tag}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-lg">
            <Sparkles size={10} className="text-amber-400" />
            <span className="text-[9px] font-black text-white italic">AI 匹配度 {detail.matchScore}%</span>
          </div>
          {detail.isOfficial && (
            <span className="px-3 py-1 rounded-lg bg-slate-900/90 text-amber-300 text-[9px] font-black uppercase tracking-widest">
              官方合作场地
            </span>
          )}
        </div>
        <h1 className="text-2xl font-black mb-3 leading-tight">{detail.title}</h1>
        <div className="text-[11px] text-slate-400 font-bold mb-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 min-w-0">
            <MapPin size={12} className="text-slate-300" />
            <span className="truncate">
              {venueType === 'PRIVATE' && !isHost && !joined
                ? (() => {
                    const loc = detail.location || '';
                    if (loc.includes('·')) {
                      const parts = loc.split('·').map(s => s.trim());
                      return parts.slice(0, -1).join(' · ') || '城市 · 待协商';
                    }
                    return '城市 · 待协商';
                  })()
                : detail.location}
            </span>
          </p>
          <button
            type="button"
            onClick={() => onRefetchLocation && onRefetchLocation()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-500 active:scale-95 transition-all"
          >
            <Navigation size={11} className="text-slate-400" />
            <span>
              {distanceMeters == null
                ? '感应距离中…'
                : distanceMeters < 1000
                ? `约 ${distanceMeters}m`
                : `约 ${(distanceMeters / 1000).toFixed(1)}km`}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-[24px] border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden border-2 border-white">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${detail.host}`} alt="host" />
          </div>
          <div>
            <h4 className="text-sm font-black italic">{detail.host}</h4>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              已完成 128 次深度策展
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[9px] text-slate-400 font-black mb-1">当前参与家长</p>
            <p className="text-sm font-black">
              {loading ? '加载中...' : `${participants} 位`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">
              活动契达雷达
            </p>
            <div className="flex justify-center">
              <div className="relative w-[150px] h-[150px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <RadarChart
                    stats={Array.isArray(detail.stats) && detail.stats.length === 5 ? detail.stats : [60, 60, 60, 60, 60]}
                    size={110}
                  />
                </div>

                <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  艺术
                </span>
                <span className="absolute top-[28px] right-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  自然
                </span>
                <span className="absolute bottom-[28px] right-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  科学
                </span>
                <span className="absolute bottom-[28px] left-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  运动
                </span>
                <span className="absolute top-[28px] left-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  策展
                </span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col justify-center items-center gap-2">
            <CheckCircle2 size={32} className="text-[#108542]" />
            <p className="text-[10px] font-black uppercase tracking-widest">认证组局</p>
            <p className="text-[8px] text-slate-400 text-center font-bold">
              该活动已通过 EXTRA 安全及品质认证
            </p>
          </div>
        </div>

        {venueType === 'COMMERCIAL' && isHost && onContactVenue && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => onContactVenue(detail)}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {detail.isOfficial ? '联系平台顾问 · 确认档期与费用' : '联系场地主 · 确认档期与费用'}
            </button>
          </div>
        )}

        {venueType === 'PUBLIC' && (
          <div className="mb-4 p-3 rounded-[24px] bg-amber-50 border border-amber-100 space-y-1.5">
            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
              公共空间指引
            </p>
            <p className="text-[10px] text-amber-800 font-bold">
              本局发生在公共空间（如公园 / 商场公共区），请提前了解现场规定，注意人流与安全边界。
            </p>
            <p className="text-[9px] text-amber-700 font-bold">
              风险自担：平台与场地产权方不对现场管理承担责任，请局长与参与家长自行确认安全措施。
            </p>
          </div>
        )}

        {!isHost && !joined && (
          <div className="mb-4 space-y-2">
            <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50 px-3 py-3 flex flex-col gap-1">
              <p className="text-[10px] font-black text-sky-800">
                你正在以【探索家】身份加入活动
              </p>
              <p className="text-[9px] font-bold text-sky-800/90">
                这一刻，你是来体验的家长，专注感受就好。
              </p>
            </div>
            {venueType === 'PRIVATE' && (
              <p className="text-[9px] text-slate-400 font-bold">
                当前仅展示大致区域，完整地址将在报名成功后由局长私下告知。
              </p>
            )}
          </div>
        )}

        {isHost && venueType !== 'COMMERCIAL' && (
          <div className="mb-4 p-3 rounded-[24px] bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                局长打卡（LBS Demo）
              </p>
              {checkinStatus === 'success' && (
                <span className="text-[9px] font-black text-[#108542]">已打卡</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-bold">
              活动开始前后，你可以用定位确认自己是否到场，作为后续信用分和履约记录的机器依据（Demo）。
            </p>
            {distanceMeters != null && (
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold">
                  当前距离目标场地约 {distanceMeters} 米，
                  {distanceMeters <= 300 ? '签到按钮已解锁。' : '靠近到 300 米内即可解锁签到。'}
                </p>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      distanceMeters <= 300 ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, ((500 - distanceMeters) / 500) * 100)
                      )}%`,
                    }}
                  />
                </div>
                {onRefetchLocation && (
                  <button
                    type="button"
                    onClick={() => onRefetchLocation()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-500 active:scale-95 transition-all"
                  >
                    <Navigation size={10} className="text-slate-400" />
                    重新感应当前位置
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={
                checkinStatus === 'pending' ||
                checkinStatus === 'success' ||
                (distanceMeters != null && distanceMeters > 300)
              }
              className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black active:scale-95 transition-all disabled:opacity-60"
            >
              <Navigation size={12} />
              {checkinStatus === 'pending' ? '打卡中…' : '到场打卡（Demo）'}
            </button>
          </div>
        )}

        {!isHost && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>本局基础费用（Demo）</span>
              <span>
                {Number.isFinite(detail.price) && detail.price > 0 ? `¥${detail.price}` : '待线下确认'}
              </span>
            </div>
            <label className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-slate-50 rounded-2xl px-3 py-2 border border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-slate-300"
                  checked={includeInsurance}
                  onChange={(e) => setIncludeInsurance(e.target.checked)}
                />
                <span>为本次活动代购基础保险（Demo）</span>
              </div>
              <span className="text-[#108542] font-black">+ ¥5</span>
            </label>
            <button
              onClick={handleJoin}
              disabled={joined || loading}
              className="w-full py-4 bg-[#108542] text白 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-green-900/20 disabled:opacity-70"
            >
              {joined ? '已报名参加' : '报名参加这个局'}
            </button>
          </div>
        )}

        {isHost && detail.lifecycleStatus !== 'finished' && detail.lifecycleStatus !== 'canceled' && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                if (!onCancelActivity) return;
                const ok = window.confirm(
                  '确定要取消本次活动吗？临近开始时间取消可能会影响你的局长信用分（Demo）。'
                );
                if (!ok) return;
                onCancelActivity(detail);
                setMessage('本局已取消，相关报名家庭将收到系统通知（Demo）。');
                if (onBack) onBack();
              }}
              className="w-full py-3 bg-red-50 text-red-500 rounded-2xl font-black text-xs active:scale-95 transition-all border border-red-100"
            >
              取消本次活动（Demo）
            </button>
          </div>
        )}

        {message && (
          <p className="text-[10px] font-black text-[#108542] bg-green-50 border border-green-100 rounded-2xl px-4 py-2 mb-6">
            {message}
          </p>
        )}

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              活动评论
            </p>
            <span className="text-[9px] text-slate-300 font-black">
              {detail.comments ? detail.comments.length : 0} 条
            </span>
          </div>
          <div className="space-y-3">
            {detail.comments &&
              detail.comments.map(c => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user}`}
                      alt={c.user}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black text-slate-800">{c.user}</span>
                      <span className="text-[9px] text-slate-300 font-black uppercase">{c.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            {!detail.comments && !loading && (
              <p className="text-[10px] text-slate-300 font-black">
                暂无评论，成为第一个分享体验的家长吧。
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

