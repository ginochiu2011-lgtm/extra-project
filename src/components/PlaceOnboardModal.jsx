import React, { useState } from 'react';

const AREA_OPTIONS = ['<50㎡', '50-100㎡', '100-300㎡', '300㎡+'];
const CAPACITY_OPTIONS = ['3 组以内', '3-5 组', '5-10 组', '10 组以上'];
const FEATURE_OPTIONS = ['花园', '露台', '室内大平层', '安静小院', '临湖/临河'];
const EQUIP_OPTIONS = ['音响', '投影', '基础灯光', '厨房可用', '基础道具'];
const SAFE_OPTIONS = ['独立卫生间', '停车位', '安全围栏', '防滑地面'];
const USE_TAGS = ['艺术手作局', '摄影/打光实验', '自然观察', '生日/庆祝', '读书会&分享'];
const PRICE_RANGE_OPTIONS = ['0-1000 元/场', '1000-3000 元/场', '3000-8000 元/场', '8000 元以上'];

export const PlaceOnboardModal = ({ onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [areaRange, setAreaRange] = useState('');
  const [capacityRange, setCapacityRange] = useState('');
  const [features, setFeatures] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [safeTags, setSafeTags] = useState([]);
  const [useTags, setUseTags] = useState([]);
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState('');
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState([]);
  const [priceMode, setPriceMode] = useState('per_session');
  const [priceRange, setPriceRange] = useState('');
  const [sharePricing, setSharePricing] = useState(true);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWeChat, setContactWeChat] = useState('');
  const [availableSlots, setAvailableSlots] = useState('');

  const toggleTag = (value, list, setter) => {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !city) return;
    onSubmit({
      name,
      city,
      areaRange,
      capacityRange,
      features,
      equipments,
      safeTags,
      useTags,
      description,
      photoUrls,
      uploadedPhotoUrls,
      priceMode,
      priceRange,
      sharePricing,
      contactName,
      contactPhone,
      contactWeChat,
      availableSlots,
    });
    onClose();
  };

  return (
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-[230] flex items-stretch md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full h-full md:h-auto bg-white rounded-t-[32px] md:rounded-[40px] p-6 md:p-8 md:max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 rounded-full bg-slate-100 mx-auto mb-4 md:mb-6" />
        <div className="flex items-start justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-xl font-black mb-1 italic">场地主入驻 · 提交你的空间</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              给局长一点灵感，你的空间就有故事
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] text-slate-400 font-black px-3 py-1 rounded-full bg-slate-50"
          >
            关闭
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 flex flex-col gap-1 mb-2">
            <p className="text-[10px] font-black text-amber-700">
              你正在以【场地主】身份提供场地
            </p>
            <p className="text-[9px] font-bold text-amber-700/90">
              你将：接收局长合作申请 · 获得合作收益（Demo）
            </p>
          </div>
          {/* 基础信息 */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                场地名称 *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如：日光花园 · 城市亲子会所"
                className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                所在城市 / 区域 *
              </label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="例如：北京 · 朝阳 · 大望路"
                className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
              />
            </div>
          </div>

          {/* 空间 & 容量 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  大致面积
                </label>
                <div className="flex flex-wrap gap-2">
                  {AREA_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAreaRange(opt)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                        areaRange === opt
                          ? 'bg-[#108542] text-white border-[#108542]'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  可容纳家庭
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAPACITY_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCapacityRange(opt)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                        capacityRange === opt
                          ? 'bg-[#108542] text-white border-[#108542]'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 特征 & 设备 */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                空间特征
              </label>
              <div className="flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleTag(opt, features, setFeatures)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                      features.includes(opt)
                        ? 'bg-[#108542] text-white border-[#108542]'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                可用设备
              </label>
              <div className="flex flex-wrap gap-2">
                {EQUIP_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleTag(opt, equipments, setEquipments)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                      equipments.includes(opt)
                        ? 'bg-[#108542] text-white border-[#108542]'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                安全与便利
              </label>
              <div className="flex flex-wrap gap-2">
                {SAFE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleTag(opt, safeTags, setSafeTags)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                      safeTags.includes(opt)
                        ? 'bg-[#108542] text-white border-[#108542]'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 适合什么样的局 */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              你觉得这里最适合发生什么样的亲子局？
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {USE_TAGS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleTag(opt, useTags, setUseTags)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                    useTags.includes(opt)
                      ? 'bg-[#108542] text-white border-[#108542]'
                      : 'bg-slate-50 text-slate-500 border-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="可以简单讲讲场地的动线、光线、你心里理想的一场活动是怎样在这里发生的～"
              rows={4}
              className="w-full rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40 resize-none"
            />
          </div>

          {/* 过往案例 / 场地图片 */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              过往案例照片或场地图片（建议上传）
            </label>
            <p className="text-[9px] text-slate-400">
              你可以直接上传图片文件，或粘贴图片链接（每行一条）；可以是过往在这里发生的局的照片，或者能代表空间状态的环境图。
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => {
                const files = Array.from(e.target.files || []);
                const urls = files.map(file => URL.createObjectURL(file));
                setUploadedPhotoUrls(prev => [...prev, ...urls]);
              }}
              className="block w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200"
            />
            {uploadedPhotoUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {uploadedPhotoUrls.map(url => (
                  <div key={url} className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <textarea
              value={photoUrls}
              onChange={e => setPhotoUrls(e.target.value)}
              placeholder="也可以在这里粘贴图片链接，每行一条"
              rows={3}
              className="w-full rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40 resize-none"
            />
          </div>

          {/* 合作意向 & 价格 */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                大致收费方式
              </label>
              <div className="flex gap-2">
                {[
                  { key: 'per_session', label: '按场次' },
                  { key: 'per_hour', label: '按时长' },
                  { key: 'per_family', label: '按家庭数' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPriceMode(opt.key)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black border ${
                      priceMode === opt.key
                        ? 'bg-[#108542] text-white border-[#108542]'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                预估价格区间（选填）
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRICE_RANGE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPriceRange(opt)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                      priceRange === opt
                        ? 'bg-[#108542] text-white border-[#108542]'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2">
              <input
                type="checkbox"
                checked={sharePricing}
                onChange={e => setSharePricing(e.target.checked)}
                className="rounded border-slate-300 text-[#108542]"
              />
              愿意在有合作机会时，让平台参与报价 & 抽佣（仅用于撮合和风控，不会对外公开）
            </label>
          </div>

          {/* 联系方式 & 可预约时段 */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                场地联系人姓名（仅用于合作沟通） *
              </label>
              <input
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="例如：李老板 / 小陈"
                className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  手机号（仅用于撮合合作）
                </label>
                <input
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="选填，例如：138****5678"
                  className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  微信号（便于后续建群）
                </label>
                <input
                  value={contactWeChat}
                  onChange={e => setContactWeChat(e.target.value)}
                  placeholder="选填，例如：sunny-space-01"
                  className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                大致可预约时段（例如：工作日晚上 / 周末白天）
              </label>
              <textarea
                value={availableSlots}
                onChange={e => setAvailableSlots(e.target.value)}
                placeholder="例如：周末 10:00-18:00 可预约；工作日 19:00-21:00 视情况开放。"
                rows={3}
                className="w-full rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name || !city || !contactName}
            className="w-full py-4 bg-[#108542] text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-60"
          >
            提交场地信息 · 等待审核
          </button>
        </form>
      </div>
    </div>
  );
};

