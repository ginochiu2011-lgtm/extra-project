import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, ChevronLeft, Image as ImageIcon, LayoutGrid, MoreHorizontal, Send } from 'lucide-react';

export const ChatWindow = ({ session, onBack, onRead, onSendMessage, onMarkCooperation }) => {
  const isSystem = session?.type === 'system';
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState(() => session?.messages || []);

  useEffect(() => {
    if (onRead && session?.id) onRead(session.id);
  }, [session?.id, onRead]);

  const send = () => {
    if (!msg.trim() || isSystem) return;
    const newMessage = { id: Date.now(), text: msg, sender: 'me', time: '现在' };
    setHistory(prev => [...prev, newMessage]);
    if (onSendMessage && session?.id) {
      onSendMessage(session.id, newMessage);
    }
    setMsg("");
  };

  return (
    <div className="absolute inset-0 bg-white z-[150] flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-6 pt-14 pb-4 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-md z-[999] pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onBack && onBack()}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 bg-slate-50 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
            aria-label="返回"
          >
            <ChevronLeft size={20} />
          </button>
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
        <div className="flex items-center gap-2">
          {session?.isPlaceConversation && onMarkCooperation && (
            <button
              onClick={() => onMarkCooperation(session)}
              className="px-3 h-9 rounded-full bg-[#108542]/10 text-[#108542] text-[10px] font-black flex items-center gap-1 active:scale-95 transition-all"
            >
              <CheckCircle2 size={14} />
              标记合作
            </button>
          )}
          {!isSystem && (
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 active:bg-slate-50 transition-colors">
              <MoreHorizontal size={20} />
            </button>
          )}
        </div>
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

