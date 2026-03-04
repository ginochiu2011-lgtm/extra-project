import React, { useState, useMemo, memo, useEffect } from 'react';
import MapPlaceView from './components/MapPlaceView';
import { 
  Compass, MapPin, MessageSquareHeart, CircleUser, 
  ChevronLeft, Share2, Sparkles, Search, Camera, 
  Users, Trees, Plus, Target, Zap, ShieldCheck, 
  Flame, Navigation, Settings, Award, BarChart3,
  CheckCircle2, Info, Loader2, Send, MoreHorizontal,
  Star, Coffee, Palette, Microscope, Bike, Image as ImageIcon,
  Heart, Trophy, UserPlus, Globe, LayoutGrid, Bell
} from 'lucide-react';

// --- 品牌 Logo 组件 ---
const ExtraLogo = memo(({ className, shadow = true }) => (
  <div className={`relative ${className}`}>
    <div className={`absolute inset-0 bg-[#108542] rotate-45 rounded-xl opacity-20 ${shadow ? 'animate-pulse' : ''}`}></div>
    <div className="absolute inset-0 bg-gradient-to-br from-[#108542] to-[#0d6a35] rounded-xl flex items-center justify-center shadow-lg border border-white/20">
      <Sparkles size={24} className="text-white" />
    </div>
  </div>
));

// --- 开屏界面 ---
const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 bg-slate-900 z-[200] flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="relative mb-8 animate-in zoom-in-50 duration-1000">
        <div className="absolute inset-0 bg-[#108542] blur-[80px] opacity-40"></div>
        <ExtraLogo className="w-24 h-24 relative z-10" />
      </div>
      <div className="text-center space-y-2 animate-in slide-in-from-bottom-10 duration-1000 delay-300">
        <h1 className="text-3xl font-black text-white italic tracking-tighter">EXTRA PARENTS</h1>
        <div className="flex items-center justify-center gap-2">
          <div className="h-[1px] w-4 bg-white/20"></div>
          <p className="text-[10px] text-[#108542] font-black tracking-[0.4em] uppercase">把有趣的家长，聚在一起</p>
          <div className="h-[1px] w-4 bg-white/20"></div>
        </div>
      </div>
      <div className="absolute bottom-16 flex flex-col items-center gap-4">
        <Loader2 className="text-white/20 animate-spin" size={20} />
        <p className="text-[10px] text-white/50 font-black tracking-widest uppercase">让遛娃，成为一种成长</p>
      </div>
    </div>
  );
};

// --- 雷达图组件 ---
const RadarChart = memo(({ stats, color = "#108542", size = 120 }) => {
  const points = useMemo(() => stats.map((stat, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const r = (stat / 100) * (size / 2);
    return `${size / 2 + r * Math.cos(angle)},${size / 2 + r * Math.sin(angle)}`;
  }).join(" "), [stats, size]);

  const gridLevels = [25, 50, 75, 100];

  return (
    <svg width={size} height={size} className="overflow-visible drop-shadow-sm transition-all duration-500">
      {gridLevels.map(level => {
        const gp = [0, 1, 2, 3, 4].map(i => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const r = (level / 100) * (size / 2);
          return `${size / 2 + r * Math.cos(angle)},${size / 2 + r * Math.sin(angle)}`;
        }).join(" ");
        return <polygon key={level} points={gp} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />;
      })}
      <polygon points={points} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" className="transition-all duration-700 ease-out" />
    </svg>
  );
});

// --- 工具：创建系统消息（后续可替换为调用云函数/API 推送） ---
const createSystemMessage = (type, text, payload = {}) => ({
  id: `sys-${Date.now()}`,
  text,
  sender: 'system',
  time: '刚刚',
  systemType: type,
  payload,
});

// --- 模块：聊天窗口 (ChatWindow) ---
const ChatWindow = ({ session, onBack, onRead }) => {
  const isSystem = session?.type === 'system';
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState(session?.messages || []);

  useEffect(() => {
    setHistory(session?.messages || []);
  }, [session?.id]);

  useEffect(() => {
    if (onRead && session?.id) onRead(session.id);
  }, [session?.id, onRead]);

  const send = () => {
    if (!msg.trim() || isSystem) return;
    setHistory(prev => [...prev, { id: Date.now(), text: msg, sender: 'me', time: '现在' }]);
    setMsg("");
  };

  return (
    <div className="absolute inset-0 bg-white z-[150] flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-6 pt-14 pb-4 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1"><ChevronLeft size={24} /></button>
          <div className={`w-10 h-10 rounded-xl overflow-hidden border flex-shrink-0 flex items-center justify-center ${isSystem ? 'bg-[#108542]/10' : 'bg-slate-50'}`}>
            {isSystem ? <Bell size={20} className="text-[#108542]" /> : (
              session?.isGroup ? <LayoutGrid size={20} className="text-slate-400" /> : (
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.name}`} alt="" />
              )
            )}
          </div>
          <div>
            <h3 className="text-sm font-black">{session?.name || '对话'}</h3>
            <p className="text-[8px] text-slate-400 font-black">
              {isSystem ? '系统通知 · 报名/活动/审核' : session?.isGroup ? '活动群聊' : '共同兴趣'}
            </p>
          </div>
        </div>
        {!isSystem && <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 active:bg-slate-50 transition-colors"><MoreHorizontal size={20} /></button>}
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!isSystem && (
          <div className="text-center py-4">
            <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">你们都关注了“亲子摄影大赛”</span>
          </div>
        )}
        {history.map((m) => (
          m.sender === 'system' ? (
            <div key={m.id} className="flex justify-center">
              <div className="max-w-[90%] px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">{m.systemType || '系统通知'}</p>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{m.text}</p>
                <p className="text-[8px] text-slate-400 mt-1">{m.time}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-bold leading-relaxed ${m.sender === 'me' ? 'bg-[#108542] text-white rounded-tr-none shadow-md shadow-green-900/10' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'}`}>
                {m.text}
                <p className={`text-[8px] mt-1 opacity-50 ${m.sender === 'me' ? 'text-right' : 'text-left'}`}>{m.time}</p>
              </div>
            </div>
          )
        ))}
      </div>
      {!isSystem && (
        <div className="p-6 bg-white border-t flex gap-3 items-center">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100"><ImageIcon size={18}/></div>
          <input 
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="和搭子聊两句..." 
            className="flex-1 h-12 bg-slate-50 rounded-xl px-4 text-xs font-bold focus:outline-none focus:ring-1 ring-[#108542] transition-all"
          />
          <button onClick={send} className="w-12 h-12 bg-[#108542] rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-green-900/20">
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

// --- 子级模块：详情页 (ActivityDetail) ---
const ActivityDetail = ({ activity, onBack, token, onJoin }) => {
  const [detail, setDetail] = useState(activity);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [message, setMessage] = useState('');

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
        if (!res.ok) throw new Error('network');
        const apiData = await res.json();
        if (!active) return;
        setDetail(apiData);
        setParticipants(apiData.participants || 0);
        setLoading(false);
        return;
      } catch {
        await fakeDelay(500);
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

  const handleJoin = () => {
    if (!token) {
      setMessage('请先登录后再报名参加该活动。');
      return;
    }
    if (joined) return;

    if (detail.lifecycleStatus === 'finished' || detail.lifecycleStatus === 'canceled') {
      setMessage('活动已结束或已取消，无法报名。');
      return;
    }

    const cap = detail.capacity ?? Infinity;
    if (participants >= cap || detail.lifecycleStatus === 'full') {
      setJoined(true);
      setMessage('名额已满，你已加入候补列表示例。');
      return;
    }

    setJoined(true);
    setParticipants(prev => prev + 1);
    setMessage('报名成功，已为你锁定席位。');
    if (onJoin) {
      onJoin(activity);
    }
  };

  return (
    <div className="absolute inset-0 bg-white z-[60] overflow-y-auto pb-32 animate-in slide-in-from-right duration-300 no-scrollbar">
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
      <div className="px-6 -mt-20 relative z-10">
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-[#108542] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/10">
            {detail.tag}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-lg">
            <Sparkles size={10} className="text-amber-400" />
            <span className="text-[9px] font-black text-white italic">AI 匹配度 {detail.matchScore}%</span>
          </div>
        </div>
        <h1 className="text-2xl font-black mb-3 leading-tight">{detail.title}</h1>
        <p className="text-[11px] text-slate-400 font-bold mb-4 flex items-center gap-2">
          <MapPin size={12} className="text-slate-300" />
          {detail.location}
        </p>

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

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">
              活动契达雷达
            </p>
            <div className="flex justify-center">
              <RadarChart stats={detail.stats} size={100} />
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

        <button
          onClick={handleJoin}
          disabled={joined || loading}
          className="w-full py-4 mb-4 bg-[#108542] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-green-900/20 disabled:opacity-70"
        >
          {joined ? '已报名参加' : '报名参加这个局'}
        </button>

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

// --- 用户资料编辑组件 ---
const UserProfileModal = ({ profile, onSave, onClose }) => {
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

// --- 导航项组件 ---
const NavItem = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#108542] scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
        {icon}
        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
);

// --- 孩子画像弹窗 ---
const ChildProfileModal = ({ initial, onSave }) => {
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

// --- 认证弹窗组件：登录 / 注册（手机号） ---
const AuthModal = ({ onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ phone: '', password: '', nickname: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const fakeDelay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.phone || !form.password || (mode === 'register' && !form.nickname)) {
      setError('请完整填写表单信息');
      return;
    }

    setLoading(true);
    await fakeDelay(600);

    const raw = localStorage.getItem('extra_users');
    const users = raw ? JSON.parse(raw) : [];

    if (mode === 'register') {
      const exists = users.find(u => u.phone === form.phone);
      if (exists) {
        setError('该手机号已注册，请直接登录');
        setLoading(false);
        return;
      }
      const now = Date.now();
      const newUser = {
        id: now,
        user_id: `U${now}`,
        nickname: form.nickname || '未命名家长',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(form.nickname || form.phone)}`,
        phone: form.phone,
        city: form.city || '未知',
        kids_age: null,
        interests: {
          art: 0,
          nature: 0,
          science: 0,
          sport: 0,
          curation: 0,
        },
        ep_score: 800,
        level: 1,
        created_at: now,
        password: form.password,
      };
      const nextUsers = [...users, newUser];
      localStorage.setItem('extra_users', JSON.stringify(nextUsers));
      const token = `fake-token-${newUser.id}`;
      localStorage.setItem('extra_token', token);
      localStorage.setItem('extra_current_user', JSON.stringify(newUser));
      setLoading(false);
      onSuccess({ token, user: newUser, fromRegister: true });
      return;
    }

    const user = users.find(u => u.phone === form.phone && u.password === form.password);
    if (!user) {
      setError('账号或密码错误');
      setLoading(false);
      return;
    }
    const token = `fake-token-${user.id}`;
    localStorage.setItem('extra_token', token);
    localStorage.setItem('extra_current_user', JSON.stringify(user));
    setLoading(false);
    onSuccess({ token, user, fromRegister: false });
  };

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-[220] flex items-center justify-center px-6">
      <div className="w-full bg-white rounded-[40px] p-8 space-y-6 animate-in zoom-in-90 duration-300">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-2xl font-black italic tracking-tight">EXTRA 登录</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.25em] mt-1">
              解锁专属家长能量空间
            </p>
          </div>
          <ExtraLogo className="w-12 h-12" shadow={false} />
        </div>

        <div className="bg-slate-100 rounded-2xl p-1 flex text-[10px] font-black uppercase tracking-widest">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl transition-all ${mode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl transition-all ${mode === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            注册
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              手机号
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="请输入常用手机号码"
              className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  昵称
                </label>
                <input
                  value={form.nickname}
                  onChange={e => handleChange('nickname', e.target.value)}
                  placeholder="在社区中展示的名字"
                  className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  所在城市
                </label>
                <input
                  value={form.city}
                  onChange={e => handleChange('city', e.target.value)}
                  placeholder="例如：北京 / 上海"
                  className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              密码
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              placeholder="至少 6 位密码"
              className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
            />
          </div>

          {error && (
            <p className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#108542] text-white font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-green-900/20 disabled:opacity-70"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? '登录 EXTRA' : '注册并登录'}
          </button>
        </form>

        <p className="text-[9px] text-slate-300 font-black leading-relaxed">
          当前为演示环境，账号信息仅保存在本地浏览器中，用于体验登录状态与界面差异。
        </p>
      </div>
    </div>
  );
};

// --- 主程序 ---
export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showNeeds, setShowNeeds] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [exploreFilter, setExploreFilter] = useState('全部');
  const [feedType, setFeedType] = useState('私信');
  const [isMapView, setIsMapView] = useState(false); // 新增地图视图切换状态
  const [auth, setAuth] = useState({ token: null, user: null });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [childProfile, setChildProfile] = useState(null);
  const [showChildProfile, setShowChildProfile] = useState(false);
  const [wishForm, setWishForm] = useState({
    ageRange: '3-6岁 (可多选)',
    focus: '偏重摄影 + 艺术创作',
  });
  const [wishLoading, setWishLoading] = useState(false);
  const [wishError, setWishError] = useState('');
  const [matchedCurators, setMatchedCurators] = useState([]);

  // 用户状态
  const [userProfile, setUserProfile] = useState({
    name: "王大星",
    epScore: 840,
    level: 4,
    stats: [70, 45, 90, 60, 80],
    invites: 12
  });

  // 初始化读取本地登录状态
  useEffect(() => {
    const token = localStorage.getItem('extra_token');
    const userRaw = localStorage.getItem('extra_current_user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setAuth({ token, user });
        setUserProfile(prev => ({
          ...prev,
          name: user.nickname || user.phone || prev.name,
          epScore: user.ep_score || prev.epScore,
          level: user.level || prev.level,
        }));
        // 读取当前用户的娃画像
        const childRaw = localStorage.getItem(`extra_child_profile_${user.id}`);
        if (childRaw) {
          try {
            const parsed = JSON.parse(childRaw);
            setChildProfile(parsed);
            if (Array.isArray(parsed.stats) && parsed.stats.length === 5) {
              setUserProfile(prev => ({
                ...prev,
                stats: parsed.stats,
              }));
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore parse error
      }
    }
  }, []);

  const handleAuthSuccess = ({ token, user, fromRegister }) => {
    setAuth({ token, user });
    setUserProfile(prev => ({
      ...prev,
      name: user.nickname || user.phone || prev.name,
      epScore: user.ep_score || prev.epScore,
      level: user.level || prev.level,
    }));
    setShowAuthModal(false);
    if (fromRegister) {
      const childRaw = localStorage.getItem(`extra_child_profile_${user.id}`);
      if (childRaw) {
        try {
          setChildProfile(JSON.parse(childRaw));
        } catch {
          // ignore
        }
      }
      setShowChildProfile(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('extra_token');
    localStorage.removeItem('extra_current_user');
    if (auth.user?.id) {
      localStorage.removeItem(`extra_child_profile_${auth.user.id}`);
    }
    setAuth({ token: null, user: null });
    setChildProfile(null);
    setShowChildProfile(false);
    setShowAuthModal(false);
    setActiveTab('explore');
  };

  const updateUserAndPersist = (updater) => {
    setAuth(prev => {
      if (!prev.user) return prev;
      const nextUser = updater(prev.user);
      try {
        localStorage.setItem('extra_current_user', JSON.stringify(nextUser));
        const raw = localStorage.getItem('extra_users');
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map(u => (u.id === nextUser.id ? nextUser : u));
          localStorage.setItem('extra_users', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
      return { ...prev, user: nextUser };
    });
  };

  const bumpInterests = (action, category) => {
    const isJoin = action === 'join';
    const delta = isJoin ? 5 : 1;
    const catMap = {
      '非常艺术': 0,
      '非常自然': 1,
      '非常科学': 2,
      '非常运动': 3,
      '非常策展': 4,
    };
    const idx = catMap[category];
    if (idx == null) return;

    setUserProfile(prev => {
      const nextStats = [...prev.stats];
      nextStats[idx] = Math.min(100, nextStats[idx] + delta);
      return { ...prev, stats: nextStats, epScore: prev.epScore + (isJoin ? 5 : 1) };
    });

    updateUserAndPersist(user => {
      const byKey = ['art', 'nature', 'science', 'sport', 'curation'];
      const key = byKey[idx];
      const nextInterests = {
        ...(user.interests || {}),
        [key]: (user.interests?.[key] || 0) + delta,
      };
      return {
        ...user,
        interests: nextInterests,
        ep_score: (user.ep_score || 800) + (isJoin ? 5 : 1),
      };
    });
  };

  const handleTabChange = (tab) => {
    if (tab === 'me' && !auth.token) {
      setShowAuthModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleWishSubmit = async (e) => {
    e.preventDefault();
    if (!auth.token) {
      setWishError('请先登录后再发布心愿池。');
      setShowAuthModal(true);
      return;
    }
    setWishError('');
    setWishLoading(true);
    const payload = {
      ageRange: wishForm.ageRange,
      focus: wishForm.focus,
      childProfile,
    };
    const fakeDelay = (ms) => new Promise(res => setTimeout(res, ms));

    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('network');
      const data = await res.json();
      setMatchedCurators(data.curators || []);
    } catch {
      await fakeDelay(500);
      setMatchedCurators([
        {
          id: 1,
          name: '林博士',
          title: '科学研学局长',
          matchScore: 96,
          tags: ['中科院合作', '深度讲解', '报告输出'],
        },
        {
          id: 2,
          name: '王大星',
          title: '城市自然探索局长',
          matchScore: 91,
          tags: ['公园共创', '摄影记录', '家庭互助'],
        },
        {
          id: 3,
          name: 'EXTRA 策展团队',
          title: '旗舰主题局长团',
          matchScore: 89,
          tags: ['年度大主题', '品牌联合', '多场景串联'],
        },
      ]);
    } finally {
      setWishLoading(false);
    }
  };

  const closeWishSheet = () => {
    setShowNeeds(false);
    setWishError('');
    setWishLoading(false);
    setMatchedCurators([]);
  };

  // 商用数据：活动列表（含经纬度，用于地图）
  const activities = useMemo(() => [
    { 
      id: 0, 
      isOfficial: true, 
      tag: "拉新福利", 
      category: "非常艺术", 
      title: "【首场旗舰】非常记录：0门槛亲子摄影大赛，用手机赢取万元大礼", 
      host: "EXTRA 官推", 
      price: 0,
      capacity: 5000,
      joined: 1290,
      lifecycleStatus: "online",
      stats: [20, 100, 30, 40, 90], 
      cover: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80", 
      location: "线上投稿 / 线下巡展", 
      lat: 39.910, lng: 116.405,
      statusText: "报名中 · 已有1290位家长参赛", 
      matchScore: 99,
      labels: ["0元参与", "拉新奖励", "专业评审"]
    },
    { 
      id: 3, 
      tag: "精选搭子局", 
      category: "非常自然", 
      title: "【家长互助】奥森公园野餐：寻找3个爱摄影的家长拍娃", 
      host: "王大星", 
      price: 0,
      capacity: 5,
      joined: 3,
      lifecycleStatus: "online",
      stats: [80, 50, 40, 60, 70], 
      cover: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80", 
      location: "朝阳 · 奥森公园", 
      lat: 39.992, lng: 116.388,
      statusText: "报名中 · 剩余2个名额", 
      matchScore: 82,
      labels: ["新手友好", "互助免费"]
    },
    { 
      id: 4, 
      tag: "高端研学局", 
      category: "非常科学", 
      title: "中科院标本馆深度行：招募3组家庭一起请高级讲解", 
      host: "林博士", 
      price: 158,
      capacity: 3,
      joined: 3,
      lifecycleStatus: "full",
      stats: [30, 20, 100, 50, 40], 
      cover: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80", 
      location: "海淀 · 标本馆", 
      lat: 39.995, lng: 116.318,
      statusText: "已满员 · 已报3组", 
      matchScore: 91,
      labels: ["名师带队", "深度报告"]
    }
  ], []);

  // 商用数据：场域（含经纬度，用于地图）
  const places = useMemo(() => [
    { id: 1, name: "阿那亚蜂巢剧场", category: "艺术策展", rating: 4.9, distance: "1.2km", address: "北戴河 · 阿那亚", match: 94, cover: "https://images.unsplash.com/photo-1518998053901-55d8d3961a00?auto=format&fit=crop&w=600&q=80", lat: 39.708, lng: 119.301 },
    { id: 2, name: "SKP-S 亲子艺术空间", category: "策展零售", rating: 4.8, distance: "0.8km", address: "朝阳 · 大望路", match: 91, cover: "https://images.unsplash.com/photo-1567449303078-57ad995bd301?auto=format&fit=crop&w=600&q=80", lat: 39.908, lng: 116.458 },
    { id: 3, name: "奥森公园", category: "自然户外", rating: 4.9, distance: "2.1km", address: "朝阳 · 奥森公园", match: 89, cover: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80", lat: 39.992, lng: 116.388 },
  ], []);

  const nearbyParents = useMemo(() => [
    { id: 1, name: "李漫漫", lat: 39.910, lng: 116.402, address: "朝阳区", interests: "摄影" },
    { id: 2, name: "陈小希", lat: 39.905, lng: 116.395, address: "朝阳区", interests: "自然" },
    { id: 3, name: "王大星", lat: 39.998, lng: 116.392, address: "海淀区", interests: "科学" },
  ], []);

  const [conversations, setConversations] = useState(() => [
    {
      id: 'sys',
      name: 'EXTRA 通知',
      lastMsg: '你已成功报名「中科院标本馆深度行」',
      time: '刚刚',
      unread: 3,
      type: 'system',
      messages: [
        { id: 's1', text: '你已成功报名「中科院标本馆深度行」，请准时参加。', sender: 'system', time: '刚刚', systemType: '报名成功' },
        { id: 's2', text: '活动「奥森公园野餐」将在 2 小时后开始，地点：朝阳 · 奥森公园', sender: 'system', time: '10:30', systemType: '活动提醒' },
        { id: 's3', text: '你发起的组局「亲子摄影大赛」已通过审核，已上线。', sender: 'system', time: '昨天', systemType: '审核通知' },
        { id: 's4', text: '你已从候补转为正式名额，活动「高端研学局」期待你的参与。', sender: 'system', time: '2天前', systemType: '候补转正' },
      ],
    },
    {
      id: 1,
      name: '李漫漫',
      lastMsg: '那我们周六早上10点在门口见？',
      time: '10:12',
      unread: 1,
      type: 'private',
      messages: [
        { id: 1, text: '你好！我对你发起的摄影大赛很感兴趣，必须是用相机拍的吗？', sender: 'other', time: '10:12' },
        { id: 2, text: '完全不用！手机记录的真实瞬间最有张力。现在投稿还有拉新积分奖励哦。', sender: 'me', time: '10:14' },
        { id: 3, text: '那我们周六早上10点在门口见？', sender: 'other', time: '10:15' },
      ],
    },
    {
      id: 2,
      name: '陈小希',
      lastMsg: '摄影大赛的作品必须是近期的吗？',
      time: '昨天',
      unread: 0,
      type: 'private',
      messages: [
        { id: 4, text: '摄影大赛的作品必须是近期的吗？', sender: 'other', time: '昨天' },
      ],
    },
    {
      id: 3,
      name: '摄影局内群',
      lastMsg: '王大星：[分享了照片]',
      time: '周一',
      unread: 5,
      type: 'group',
      isGroup: true,
      messages: [
        { id: 5, text: '王大星：[分享了照片]', sender: 'other', time: '周一' },
      ],
    },
  ]);

  const markConversationRead = (id) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  const renderExplore = () => {
    const filtered = exploreFilter === '全部' ? activities : activities.filter(a => a.category === exploreFilter);
    return (
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-slate-50/30">
        <header className="px-6 pt-14 pb-4 bg-white sticky top-0 z-30 flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-3">
            <ExtraLogo className="w-10 h-10" shadow={false} />
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none mb-1">组局广场</h1>
              <p className="text-[#108542] text-[8px] font-black tracking-widest uppercase opacity-60">EXTRA DISCOVERY</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100"><Search size={18} /></button>
            <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 relative">
               <ImageIcon size={18} />
               <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">1</span>
            </button>
          </div>
        </header>

        <div className="bg-white sticky top-[108px] z-20">
          <div className="px-6 flex gap-6 overflow-x-auto no-scrollbar py-4 border-b border-slate-50">
            {/* 新增分类：非常策展 */}
            {["全部", "非常艺术", "非常自然", "非常科学", "非常运动", "非常策展"].map((txt, i) => (
              <button 
                key={i} 
                onClick={() => setExploreFilter(txt)}
                className={`shrink-0 text-[13px] font-black transition-all pb-1 relative ${exploreFilter===txt ? 'text-[#108542]' : 'text-slate-300'}`}
              >
                {txt}
                {exploreFilter===txt && <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#108542] rounded-full animate-in slide-in-from-left duration-300"></div>}
              </button>
            ))}
          </div>
        </div>

        <section className="px-6 py-6 space-y-8">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                bumpInterests('view', item.category);
                setSelectedActivity(item);
              }}
              className="group bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
            >
              <div className="relative h-56 overflow-hidden">
                <img src={item.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1.5">
                    <Sparkles size={10} className="text-amber-400" />
                    <span className="text-[9px] font-black text-white italic">AI 匹配度 {item.matchScore}%</span>
                  </div>
                  <div className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-[9px] font-black text-white italic">{item.category}</span>
                  </div>
                </div>
                {item.isOfficial && (
                    <div className="absolute top-4 right-4 bg-[#108542] text-white px-2 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase shadow-lg shadow-green-900/20">Official</div>
                )}
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex gap-2 mb-2">
                    {item.labels.map(l => <span key={l} className="text-[8px] font-black text-white/80 bg-white/10 px-2 py-0.5 rounded border border-white/20">{l}</span>)}
                  </div>
                </div>
              </div>
              <div className="p-6">
                 <h3 className="text-lg font-black text-slate-900 leading-tight mb-3 group-hover:text-[#108542] transition-colors">{item.title}</h3>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.host}`} alt="host" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.host}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-[#108542] uppercase tracking-tighter">
                        {item.statusText || ''}
                      </span>
                      <div className="w-[1px] h-3 bg-slate-200"></div>
                      <span className="text-sm font-black italic">
                        {item.price === 0 ? 'FREE' : `¥${item.price}`}
                      </span>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  };

  const renderPlace = () => (
    <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-slate-50 animate-in fade-in duration-300">
      <header className="px-6 pt-14 pb-8 bg-white border-b flex justify-between items-end sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black italic mb-1 uppercase tracking-tighter">Energy Spaces</h1>
          <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">寻找最契合你画像的高能量空间</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsMapView(!isMapView)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isMapView ? 'bg-black text-white border-black' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
            >
                <Navigation size={18}/>
            </button>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all">场地主入驻</button>
        </div>
      </header>

      {/* 地图功能区域：定位、附近活动/场地/家长、导航 */}
      <div className={`px-6 overflow-hidden transition-all duration-500 ease-in-out ${isMapView ? 'max-h-[420px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
        <MapPlaceView
          places={places}
          activities={activities}
          parents={nearbyParents}
          onSelectPlace={(p) => {}}
          onSelectActivity={(a) => setSelectedActivity(activities.find(x => x.id === a.id) || a)}
          onSelectParent={(p) => {}}
        />
      </div>

      <div className="px-6 py-6 grid grid-cols-1 gap-6">
        {places.map(p => (
          <div key={p.id} className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm flex active:scale-[0.98] transition-all">
            <div className="w-32 h-32 shrink-0">
              <img src={p.cover} className="w-full h-full object-cover" alt="place" />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-black text-sm">{p.name}</h4>
                  <div className="flex items-center gap-0.5 text-amber-400 text-[10px] font-black"><Star size={10} className="fill-amber-400" />{p.rating}</div>
                </div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter flex items-center gap-1"><MapPin size={10}/>{p.distance} · {p.category}</p>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black text-[#108542] bg-green-50 px-2 py-1 rounded italic uppercase">契合度 {p.match}%</span>
                <button className="text-[10px] font-black text-slate-400 underline decoration-slate-200 underline-offset-4">查看地图</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeed = () => {
    const filtered = feedType === '系统通知'
      ? conversations.filter(c => c.type === 'system')
      : conversations.filter(c => c.type !== 'system');
    return (
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-white animate-in fade-in duration-300">
        <header className="px-6 pt-14 pb-4 flex justify-between items-end border-b">
          <div>
            <h1 className="text-2xl font-black italic leading-none mb-1 uppercase tracking-tighter">Messages</h1>
            <p className="text-[8px] text-[#108542] font-black tracking-widest uppercase">Inbox & Community</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['私信', '系统通知'].map(type => (
              <button 
                key={type}
                onClick={() => setFeedType(type)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${feedType === type ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </header>
        <div className="divide-y border-slate-50">
          {filtered.map(c => (
            <div key={c.id} onClick={() => setCurrentChat(c)} className="p-6 flex items-center gap-4 active:bg-slate-50 transition-colors group">
              <div className={`w-14 h-14 rounded-2xl flex-shrink-0 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center ${c.type === 'system' ? 'bg-[#108542]/10' : c.isGroup ? 'bg-slate-900' : 'bg-slate-100'}`}>
                {c.type === 'system' ? (
                  <Bell size={24} className="text-[#108542]" />
                ) : c.isGroup ? (
                  <LayoutGrid size={24} className="text-white/20" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`} alt="" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-black text-sm group-hover:text-[#108542] transition-colors flex items-center gap-2">
                    {c.name}
                    {c.type === 'system' && <span className="px-1.5 py-0.5 bg-green-50 text-[#108542] text-[8px] font-black rounded uppercase">系统</span>}
                    {c.isGroup && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-black rounded uppercase">Group</span>}
                  </h4>
                  <span className="text-[9px] text-slate-300 font-bold uppercase">{c.time}</span>
                </div>
                <p className="text-xs text-slate-400 font-bold truncate pr-4">{c.lastMsg}</p>
              </div>
              {(c.unread || 0) > 0 && (
                <div className="min-w-[18px] h-[18px] rounded-full bg-[#108542] flex items-center justify-center px-1">
                  <span className="text-white text-[9px] font-black">{c.unread}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-8 text-center opacity-30">
          <Loader2 size={24} className="mx-auto text-slate-300 animate-spin mb-2" />
          <p className="text-[10px] font-black uppercase tracking-widest italic">加载更多历史记录</p>
        </div>
      </div>
    );
  };

  const renderMe = () => (
    <div className="flex-1 bg-white pt-16 px-8 animate-in fade-in duration-300 overflow-y-auto pb-32 no-scrollbar">
       <div className="flex justify-between items-start mb-8">
          <div className="relative cursor-pointer group" onClick={() => setShowProfileEdit(true)}>
            <div className="w-20 h-20 rounded-[28px] bg-slate-100 overflow-hidden border-2 border-white shadow-xl relative transition-transform group-hover:scale-105 active:scale-95">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Star" alt="me" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 px-2 py-0.5 rounded-lg text-[8px] font-black border border-white shadow-sm flex items-center gap-1">
              <ShieldCheck size={10} /> 非常认证
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 active:scale-90 transition-all"><Globe size={18}/></button>
            <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 active:scale-90 transition-all"><Settings size={18}/></button>
          </div>
       </div>

       <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900">{auth.user?.nickname || userProfile.name}</h2>
            <div className="px-2 py-0.5 bg-green-50 text-[#108542] rounded-full text-[8px] font-black tracking-widest italic uppercase">
              {auth.token ? '已登录' : '游客'}
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-300 tracking-widest uppercase italic">EXTRA PARENT SINCE 2024</p>
       </div>

       <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden shadow-2xl col-span-2">
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black text-white/40 tracking-[0.2em] mb-1 uppercase">EP 能量资产</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black italic tabular-nums">{userProfile.epScore}</span>
                  <span className="text-green-400 text-[10px] font-black italic">POINTS</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-white/40 tracking-[0.2em] mb-1 uppercase">当前等级</p>
                <span className="text-amber-400 text-sm font-black italic tracking-widest uppercase">Level {userProfile.level}</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10"><Award size={80} /></div>
          </div>
          
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col justify-between">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">本月邀请拉新</p>
             <div className="flex items-end justify-between">
                <span className="text-2xl font-black tabular-nums">{userProfile.invites}</span>
                <UserPlus size={16} className="text-slate-300 mb-1" />
             </div>
          </div>
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col justify-between">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
               娃的兴趣雷达
               <span className="text-[9px] text-[#108542] font-black italic">
                 平均{(userProfile.stats.reduce((a, b) => a + b, 0) / userProfile.stats.length) | 0}%
               </span>
             </p>
             <div className="flex items-center justify-between gap-4">
               <div className="w-24 h-24 flex items-center justify-center">
                 <RadarChart stats={userProfile.stats} size={90} />
               </div>
               <div className="text-[9px] text-slate-400 font-black space-y-1 leading-relaxed">
                 <p>艺术 / 自然 / 科学 / 运动 / 策展</p>
                 <p className="text-slate-500">用于匹配更适合你娃的局与场域。</p>
               </div>
             </div>
          </div>
       </div>

       <div className="mb-10">
         <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
            成就徽章池 <span>3/12</span>
         </h3>
         <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
           {[
             { i: <Palette size={16} />, c: '艺术先锋', b: 'bg-purple-50 text-purple-600' },
             { i: <Camera size={16} />, c: '光影捕手', b: 'bg-indigo-50 text-indigo-600' },
             { i: <Microscope size={16} />, c: '科学观测', b: 'bg-blue-50 text-blue-600' },
             { i: <Bike size={16} />, c: '运动达人', b: 'bg-orange-50 text-orange-600' },
           ].map((a, idx) => (
             <div key={idx} className={`shrink-0 w-20 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border border-slate-50 shadow-sm ${a.b}`}>
               {a.i}
               <span className="text-[8px] font-black text-center px-1">{a.c}</span>
             </div>
           ))}
         </div>
       </div>

       <div className="space-y-3">
         <button className="w-full py-5 bg-[#108542] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-green-900/10">
            <Plus size={18}/> 发起我的自研局
         </button>
         <button className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Share2 size={14}/> 邀请好友 · 赚取 +50 EP
         </button>
         {auth.token && (
           <button
             onClick={handleLogout}
             className="w-full py-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
           >
             退出登录
           </button>
         )}
       </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 max-w-md mx-auto overflow-hidden font-sans relative text-slate-800 shadow-2xl">
      <div className="absolute inset-0 bg-white w-full h-full">
        {isInitializing ? (
          <SplashScreen onComplete={() => setIsInitializing(false)} />
        ) : (
          <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* 需要登录时手动展示登录/注册弹窗 */}
            {showAuthModal && !auth.token && <AuthModal onSuccess={handleAuthSuccess} />}
            {activeTab === 'explore' && renderExplore()}
            {activeTab === 'place' && renderPlace()}
            {activeTab === 'feed' && renderFeed()}
            {activeTab === 'me' && renderMe()}

            {/* 子级导航 */}
            {currentChat && (
              <ChatWindow
                session={currentChat}
                onBack={() => setCurrentChat(null)}
                onRead={markConversationRead}
              />
            )}
            {selectedActivity && (
              <ActivityDetail
                activity={selectedActivity}
                onBack={() => setSelectedActivity(null)}
                token={auth.token}
                onJoin={(act) => bumpInterests('join', act.category)}
              />
            )}
            {showProfileEdit && <UserProfileModal profile={userProfile} onSave={(s) => { setUserProfile(p=>({...p, stats:s})); setShowProfileEdit(false); }} onClose={() => setShowProfileEdit(false)} />}
            {auth.token && showChildProfile && (
              <ChildProfileModal
                initial={childProfile}
                onSave={(profile) => {
                  setChildProfile(profile);
                  if (Array.isArray(profile.stats) && profile.stats.length === 5) {
                    setUserProfile(prev => ({
                      ...prev,
                      stats: profile.stats,
                    }));
                  }
                  if (auth.user?.id) {
                    localStorage.setItem(`extra_child_profile_${auth.user.id}`, JSON.stringify(profile));
                  }
                  setShowChildProfile(false);
                }}
              />
            )}
            
            {showNeeds && (
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end animate-in fade-in duration-200"
                onClick={closeWishSheet}
              >
                <div
                  className="w-full bg-white rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6"></div>
                  <h2 className="text-xl font-black mb-1 italic">发布心愿池</h2>
                  <p className="text-[#108542] text-[8px] font-black mb-6 tracking-widest uppercase italic tracking-tighter underline">
                    让持证局长为你定制深度行程
                  </p>

                  <form className="space-y-4" onSubmit={handleWishSubmit}>
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div className="text-slate-400 mt-1">
                          <Target size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            目标娃龄
                          </p>
                          <input
                            value={wishForm.ageRange}
                            onChange={e =>
                              setWishForm(prev => ({ ...prev, ageRange: e.target.value }))
                            }
                            className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div className="text-slate-400 mt-1">
                          <Zap size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            倾向维度
                          </p>
                          <input
                            value={wishForm.focus}
                            onChange={e =>
                              setWishForm(prev => ({ ...prev, focus: e.target.value }))
                            }
                            className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {wishError && (
                      <p className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-2">
                        {wishError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={wishLoading}
                      className="w-full py-5 bg-[#108542] text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {wishLoading && <Loader2 size={16} className="animate-spin" />}
                      发布心愿 · 匹配局长
                    </button>
                  </form>

                  {matchedCurators.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          为你匹配到的局长
                        </p>
                        <span className="text-[9px] text-slate-300 font-black">
                          {matchedCurators.length} 位
                        </span>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                        {matchedCurators.map(c => (
                          <div
                            key={c.id}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-200 flex-shrink-0">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`}
                                alt={c.name}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <p className="text-xs font-black text-slate-900">{c.name}</p>
                                  <p className="text-[9px] text-slate-400 font-black">
                                    {c.title}
                                  </p>
                                </div>
                                <span className="text-[9px] text-[#108542] font-black px-2 py-1 bg-green-50 rounded-full">
                                  契合度 {c.matchScore}%
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(c.tags || []).map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-full bg-white text-[8px] font-black text-slate-400 border border-slate-100"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 全局底部导航栏 */}
            <nav className="absolute bottom-0 left-0 w-full h-24 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-6 pb-6 z-40">
              <NavItem active={activeTab === 'explore'} onClick={() => handleTabChange('explore')} icon={<Compass size={22} />} label="组局" />
              <NavItem active={activeTab === 'place'} onClick={() => handleTabChange('place')} icon={<MapPin size={22} />} label="场域" />
              <button onClick={() => setShowNeeds(true)} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white -mt-8 shadow-xl active:scale-90 transition-transform">
                <Plus size={24} />
              </button>
              <NavItem
                active={activeTab === 'feed'}
                onClick={() => handleTabChange('feed')}
                icon={
                  <span className="relative inline-block">
                    <MessageSquareHeart size={22} />
                    {totalUnread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-[#108542] text-white text-[9px] font-black flex items-center justify-center px-1">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    )}
                  </span>
                }
                label="消息"
              />
              <NavItem active={activeTab === 'me'} onClick={() => handleTabChange('me')} icon={<CircleUser size={22} />} label={auth.token ? '我的' : '登录'} />
            </nav>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}