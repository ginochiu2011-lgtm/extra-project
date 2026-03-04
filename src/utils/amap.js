/**
 * 高德地图 JS API 加载工具（H5/Web 端）
 * 使用前请在 .env 中配置 VITE_AMAP_KEY
 * 申请地址: https://lbs.amap.com/
 *
 * 小程序端对应 API：
 * - wx.getLocation 获取当前位置
 * - wx.openLocation 打开内置地图导航
 * - <map> 组件展示地图
 * 小程序可使用 腾讯位置服务 或 高德小程序 SDK
 */
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || '';

export const loadAMap = () => {
  if (window.AMap) return Promise.resolve(window.AMap);
  if (!AMAP_KEY) {
    return Promise.reject(new Error('请配置 VITE_AMAP_KEY'));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.Geolocation,AMap.Geocoder`;
    script.async = true;
    script.onload = () => resolve(window.AMap);
    script.onerror = () => reject(new Error('高德地图加载失败'));
    document.head.appendChild(script);
  });
};

export const hasAMapKey = () => !!AMAP_KEY;
