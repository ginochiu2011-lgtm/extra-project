import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ExtraLogo } from './ExtraLogo';

export const AuthModal = ({ onSuccess }) => {
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
        // 演示环境简化实现：密码会以明文形式进入 localStorage。
        // 生产环境应使用后端认证（含盐哈希/加密、HTTPS、风控等），不要在前端持久化明文密码。
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

