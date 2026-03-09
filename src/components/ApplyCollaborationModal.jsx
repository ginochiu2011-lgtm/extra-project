import React, { useState } from 'react';
import { CheckCircle2, ChevronLeft, MapPin, Calendar, Users, Tv, Loader2 } from 'lucide-react';

export const ApplyCollaborationModal = ({ place, onClose, onConfirm }) => {
  const [families, setFamilies] = useState('3-5');
  const [dateOption, setDateOption] = useState('weekend');
  const [equipments, setEquipments] = useState([]);
  const [paying, setPaying] = useState(false);

  if (!place) return null;

  const isEnterpriseBrand =
    place.ownershipType === 'ENTERPRISE' && place.allowDirectorCoop !== false;

  const toggleEquip = (key) => {
    setEquipments((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      const payload = {
        families,
        dateOption,
        equipments,
      };
      onConfirm?.(place, payload);
      setPaying(false);
    }, 500);
  };

  return (
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-stretch"
      onClick={onClose}
    >
      <div
        className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-8 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
            aria-label="关闭合作申请"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            {isEnterpriseBrand ? 'BRAND PARTNERSHIP' : 'APPLY FOR COLLAB'}
          </span>
        </div>

        <h2 className="text-lg font-black mb-1">
          {isEnterpriseBrand ? '向「' : '向「'}
          {place.name}
          {isEnterpriseBrand ? '」发起品牌联名合作意向' : '」发起合作申请'}
        </h2>
        <p className="text-[11px] text-slate-500 font-bold mb-4">
          {isEnterpriseBrand
            ? '先简单勾选你希望覆盖的家庭数、人群时间段和对场地支持的需求，平台会以品牌联名视角帮你与场地方对齐方案（Demo）。'
            : '先简单勾选你想要的人数、时间和设备，支付 9.9 元预约意向金后，平台会协助撮合你和场地主进一步确认方案。'}
        </p>

        <div className="space-y-4 mb-4">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Users size={12} /> {isEnterpriseBrand ? '预计覆盖家庭数 / 人群' : '预计参与家庭数'}
            </p>
            <div className="flex flex-wrap gap-2">
              {['1-2', '3-5', '5-8', '8 组以上'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFamilies(opt)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                    families === opt
                      ? 'bg-[#108542] text-white border-[#108542]'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={12} /> {isEnterpriseBrand ? '期望档期' : '大致时间'}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'weekend', label: '周末白天' },
                { key: 'weekday_evening', label: '工作日晚上' },
                { key: 'holiday', label: '节假日' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDateOption(opt.key)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                    dateOption === opt.key
                      ? 'bg-[#108542] text白 border-[#108542]'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Tv size={12} /> {isEnterpriseBrand ? '你大致需要哪些支持？' : '你大致需要哪些设备？'}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'sound', label: '音响' },
                { key: 'projector', label: '投影' },
                { key: 'lights', label: '基础灯光' },
                { key: 'tables', label: '桌椅布置' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleEquip(opt.key)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                    equipments.includes(opt.key)
                      ? 'bg-[#108542] text-white border-[#108542]'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <div>
                <p className="text-[11px] font-black">
                  {isEnterpriseBrand ? '品牌联名锁定金' : '预约意向金'}
                </p>
                <p className="text-[9px] text-white/70">
                  {isEnterpriseBrand
                    ? '9.9 元用于锁定品牌联名合作名额，后续由平台协助走真实合同 / 支付流程（Demo）。'
                    : '9.9 元用于锁定合作意向，后续抵扣场地费用（Demo）。'}
                </p>
              </div>
            </div>
            <p className="text-lg font-black">¥9.9</p>
          </div>
          <button
            type="button"
            disabled={paying}
            onClick={handlePay}
            className="w-full py-3 bg-[#108542] text-white rounded-2xl font-black text-sm active:scale-95 transition-all disabled:opacity-70"
          >
            {paying ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 size={16} className="animate-spin" />
                支付中…
              </span>
            ) : (
              '支付 9.9 元 · 预约合作'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

