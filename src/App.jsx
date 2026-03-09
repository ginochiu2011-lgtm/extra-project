import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ExtraLogo } from './components/ExtraLogo';
import { SplashScreen } from './components/SplashScreen';
import { RadarChart } from './components/RadarChart';
import { NavItem } from './components/NavItem';
import { ChatWindow } from './components/ChatWindow';
import { ActivityDetail } from './components/ActivityDetail';
import { UserProfileModal } from './components/UserProfileModal';
import { ChildProfileModal } from './components/ChildProfileModal';
import { AuthModal } from './components/AuthModal';
import { PlaceOnboardModal } from './components/PlaceOnboardModal';
import { ApplyCollaborationModal } from './components/ApplyCollaborationModal';
import { DEFAULT_ACTIVITIES, DEFAULT_PLACES } from './data/defaults';
import { FilterBar } from './components/FilterBar';
import { WishView } from './components/WishView';
import { ExploreTabView } from './components/ExploreTabView';
import { PlaceTabView } from './components/PlaceTabView';
import { FeedTabView } from './components/FeedTabView';
import { MeTabView } from './components/MeTabView';
import { useAuthDispatch, useAuthState } from './context/AuthContext.jsx';
import { 
  Compass, MapPin, MessageSquareHeart, CircleUser, 
  ChevronLeft, Share2, Sparkles, Search, Camera, 
  Users, Trees, Plus, Target, Zap, ShieldCheck, 
  Navigation, Settings, Award,
  CheckCircle2, Info, Loader2, Send, MoreHorizontal,
  Star, Coffee, Palette, Microscope, Bike, Image as ImageIcon,
  UserPlus, Globe, LayoutGrid, Bell
} from 'lucide-react';

const createSystemMessage = (type, text) => ({
  id: `sys-${Date.now()}`,
  text,
  sender: 'system',
  time: '刚刚',
  systemType: type,
});

const WISH_SCENE_OPTIONS = ['城市散步', '公园野餐', '咖啡馆闲聊', '博物馆半日', '商场逛逛'];
const WISH_VIBE_OPTIONS = ['轻松聊天', '边玩边聊', '主题式深聊', '拍照打卡', '放电为主'];
const VIEW_THROTTLE_MS = 800;
const EARTH_RADIUS_KM = 6371; // 地球半径（用于距离计算）
const WISH_TIME_OPTIONS = ['本周', '下周', '工作日晚上', '周末白天'];
const PLACE_CAPABILITY_OPTIONS = ['大草坪', '有电源', '可投影', '可封场', '有遮阴'];

const CATEGORY_INDEX_MAP = {
  '非常艺术': 0,
  '非常自然': 1,
  '非常科学': 2,
  '非常运动': 3,
  '非常策展': 4,
};

const calculateDirectorScore = (stats) => {
  const {
    total_published = 0,
    total_completed = 0,
    recap_count = 0,
    rating_avg = 0,
    venue_rating_avg = 0,
    featured_recaps = 0,
  } = stats || {};

  if (total_published <= 0) {
    const base = 80 + featured_recaps * 2;
    return Math.min(100, Math.max(0, base));
  }

  const completionRate = total_completed > 0 ? total_completed / total_published : 0;
  const recapPerCompleted = total_completed > 0 ? Math.min(1, recap_count / total_completed) : 0;
  const parentRatingNorm = Math.min(1, Math.max(0, rating_avg / 5));
  const venueRatingNorm = Math.min(1, Math.max(0, venue_rating_avg / 5));

  let score =
    completionRate * 40 +
    recapPerCompleted * 30 +
    parentRatingNorm * 20 +
    venueRatingNorm * 10 +
    featured_recaps * 2;

  score = Math.max(0, Math.min(100, score));
  return Math.round(score);
};

const getDirectorPrivileges = (score) => {
  if (score >= 90) {
    return { depositFree: true, badge: 'Gold' };
  }
  if (score < 70) {
    return { doubleDeposit: true, limitActive: 1 };
  }
  return {};
};

// --- 主程序 ---
export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [exploreFilter, setExploreFilter] = useState('全部');
  const [feedType, setFeedType] = useState('私信');
  const [isMapView, setIsMapView] = useState(false); // 地图视图（已移除，仅保留占位以防其他地方引用）
  const auth = useAuthState();
  const authDispatch = useAuthDispatch();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showChildProfile, setShowChildProfile] = useState(false);
  const lastViewBumpByCategoryRef = useRef(new Map());
  const isMountedRef = useRef(true);
  const [showPlaceOnboard, setShowPlaceOnboard] = useState(false);
  const [wishForm, setWishForm] = useState({
    title: '',
    scenes: [],
    vibes: [],
    timePrefs: [],
    area: '',
    mode: 'find_buddies',
    isProposal: false,
    suggestedArea: '',
    targetPeopleCount: 4,
  });
  const [customScene, setCustomScene] = useState('');
  const [customVibe, setCustomVibe] = useState('');
  const [wishLoading, setWishLoading] = useState(false);
  const [wishError, setWishError] = useState('');
  const [matchedCurators, setMatchedCurators] = useState([]);
  const [wishes, setWishes] = useState(() => {
    try {
      const raw = localStorage.getItem('extra_wishes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 1,
        title: '本周末想去徐汇滨江溜娃 + 喝咖啡，有人一起吗？',
        scenes: ['城市散步', '咖啡馆闲聊'],
        vibes: ['轻松聊天', '拍照打卡'],
        timePrefs: ['本周', '周末白天'],
        area: '徐汇滨江',
        likeCount: 3,
        mode: 'find_buddies',
        isProposal: false,
        suggestedArea: '徐汇滨江一带',
        targetPeopleCount: 4,
        participantCount: 3,
        ownerId: 'demo-parent-1',
        ownerName: '徐汇滨江家长',
        status: 'OPEN',
        appointmentPlaceId: null,
        hasRecap: false,
        hasPromptedForRecap: false,
      },
      {
        id: 2,
        title: '想找 3-4 组家庭一起去公园搞一次自然观察小实验。',
        scenes: ['公园野餐'],
        vibes: ['边玩边聊', '主题式深聊'],
        timePrefs: ['下周', '周末白天'],
        area: '朝阳公园',
        likeCount: 5,
        mode: 'find_curator',
        isProposal: true,
        suggestedArea: '朝阳公园附近可野餐草地',
        targetPeopleCount: 4,
        participantCount: 3,
        ownerId: 'demo-parent-2',
        ownerName: '朝阳自然观察家长',
        status: 'MATCHED', // Demo：视为已撮合成功
        appointmentPlaceId: 3, // 对应奥森公园
        hasRecap: false,
        hasPromptedForRecap: false,
      },
    ];
  });

  const [showSearch, setShowSearch] = useState(false);
  const [showInspiration, setShowInspiration] = useState(false);
  const [hasNewInspiration, setHasNewInspiration] = useState(true);
  const [wishToCurate, setWishToCurate] = useState(null);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showCustomActivity, setShowCustomActivity] = useState(false);
  const [applyPlace, setApplyPlace] = useState(null);
  const [wishForPlaceOnboard, setWishForPlaceOnboard] = useState(null);
  const [respondWishForVenue, setRespondWishForVenue] = useState(null);
  const [venueRespondFamilies, setVenueRespondFamilies] = useState('3-5 组家庭');
  const [venueRespondTime, setVenueRespondTime] = useState('周末白天');
  const [venueRespondNotes, setVenueRespondNotes] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [pendingActivity, setPendingActivity] = useState(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [wishToRecap, setWishToRecap] = useState(null);
  const [showWishRecapDialog, setShowWishRecapDialog] = useState(false);
  const [wishRecapImage, setWishRecapImage] = useState('');
  const [inspirationLikes, setInspirationLikes] = useState({});
  const [displayReliability, setDisplayReliability] = useState(() => {
    const stats =
      auth.user?.directorStats ||
      auth.userProfile.directorStats ||
      {};
    return (
      stats.reliability_score ?? calculateDirectorScore(stats)
    );
  });
  const [placeCapabilitiesFilter, setPlaceCapabilitiesFilter] = useState([]);
  const [radarPulse, setRadarPulse] = useState(false);
  const [cooperations, setCooperations] = useState([]);
  const [cooperationSession, setCooperationSession] = useState(null);
  const [cooperationAmount, setCooperationAmount] = useState('');
  const [cooperationRate, setCooperationRate] = useState(10);
  const [cooperationError, setCooperationError] = useState('');
  const [paymentActivity, setPaymentActivity] = useState(null);
  const [paymentMeta, setPaymentMeta] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [depositActivity, setDepositActivity] = useState(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositError, setDepositError] = useState('');
  const [orders, setOrders] = useState([]);

  // 将心愿池状态持久化到 localStorage，避免刷新后状态丢失
  useEffect(() => {
    try {
      localStorage.setItem('extra_wishes', JSON.stringify(wishes));
    } catch {
      // ignore
    }
  }, [wishes]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const completeActivity = (activityId) => {
    setActivities(prev =>
      prev.map(a =>
        a.id === activityId
          ? {
              ...a,
              lifecycleStatus: 'FINISHED',
              statusText:
                typeof a.joined === 'number'
                  ? `已结束 · 共${a.joined}组家庭参与（Demo）`
                  : '已结束（Demo）',
            }
          : a
      )
    );

    // 活动结束后，如果是基于某条心愿生成的局，则自动结算该心愿
    const act = activities.find(a => a.id === activityId);
    if (act && act.sourceWishId) {
      setWishes(prev =>
        prev.map(w =>
          w.id === act.sourceWishId
            ? {
                ...w,
                status: 'COMPLETED',
                hasRecap: w.hasRecap || Boolean(act.recap && act.recap.images && act.recap.images.length),
              }
            : w
        )
      );
    }

    // Demo：每成功结束一场局，为局长增加 1 分信用分（与 Recap 加分叠加）
    updateDirectorScore(1);
  };

  const cancelActivity = (activity) => {
    // Demo：统一视为「临近开始时间取消」，直接走重罚分支
    const penalty = -10;

    setActivities(prev =>
      prev.map(a =>
        a.id === activity.id
          ? {
              ...a,
              lifecycleStatus: 'CANCELED',
              statusText: '已取消 · 本次保证金将进入审核流程（Demo）',
            }
          : a
      )
    );

    // 扣减局长信用分
    updateDirectorScore(penalty);

    // 发送一条系统通知，说明本次取消导致的信用影响（Demo）
    const msg = createSystemMessage(
      '活动取消',
      `你取消了活动「${activity.title}」，由于临近开始时间，本次扣除 ${Math.abs(
        penalty
      )} 分局长信用分，保证金将进入审核与处置流程（Demo）。`
    );
    setConversations(prev => {
      const existing = prev.find(c => c.id === 'sys-cancel');
      if (existing) {
        const updated = {
          ...existing,
          messages: [...(existing.messages || []), msg],
          lastMsg: msg.text,
          time: msg.time,
          unread: (existing.unread || 0) + 1,
        };
        return prev.map(c => (c.id === 'sys-cancel' ? updated : c));
      }
      const conv = {
        id: 'sys-cancel',
        name: '取消记录 · Demo',
        lastMsg: msg.text,
        time: msg.time,
        unread: 1,
        type: 'system',
        messages: [msg],
      };
      return [conv, ...prev];
    });
  };

  const handleCreateRecap = async (activityId, recapPayload) => {
    const act = activities.find(a => a.id === activityId);
    if (!act) return;

    if (!recapPayload || (!recapPayload.images && !recapPayload.text)) {
      console.warn('handleCreateRecap: 缺少 Recap 内容（Demo）');
      return;
    }

    // Demo：将 Recap 附加到活动对象上
    setActivities(prev =>
      prev.map(a =>
        a.id === activityId
          ? {
              ...a,
              recap: {
                ...(a.recap || {}),
                ...recapPayload,
              },
            }
          : a
      )
    );

    // 当活动状态为 STARTED 时，通过上传 Recap 来触发完成态
    if (act.lifecycleStatus === 'STARTED') {
      completeActivity(activityId);
    }

    // Recap 上传成功后为局长增加 2 分信用分（Demo）
    updateDirectorScore(2);

    // Demo：将 Recap 图片 URL 作为案例，挂载到关联场地的 caseStudies 中，方便后续局长参考
    const firstImage =
      (Array.isArray(recapPayload.images) && recapPayload.images[0]) ||
      null;
    if (firstImage) {
      // 简单的活动-场地关联策略：优先用经纬度匹配，否则用地址包含关系
      const relatedPlace =
        places.find(
          p =>
            p.lat != null &&
            p.lng != null &&
            act.lat != null &&
            act.lng != null &&
            p.lat === act.lat &&
            p.lng === act.lng
        ) ||
        places.find(
          p =>
            act.location &&
            (p.address && act.location.includes(p.address.split('·')[0])) &&
            p.lat != null &&
            p.lng != null
        );

      if (relatedPlace) {
        setPlaces(prev =>
          prev.map(p => {
            if (p.id !== relatedPlace.id) return p;
            const existing = Array.isArray(p.caseStudies) ? p.caseStudies : [];
            const newStudy = {
              title: act.title || '来自局长的现场 Recap',
              description: recapPayload.text || '本次活动上传了一张现场 Recap（Demo）。',
              images: [firstImage],
            };
            return {
              ...p,
              caseStudies: [newStudy, ...existing],
            };
          })
        );
      }
    }
  };

  const toRad = (deg) => (deg * Math.PI) / 180;

  const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    if (
      lat1 == null ||
      lng1 == null ||
      lat2 == null ||
      lng2 == null
    ) {
      return null;
    }
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('当前环境不支持定位');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError('');
      },
      () => {
        setLocationError('定位失败，可手动选择场地查看详情');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [exploreTopicFilter, setExploreTopicFilter] = useState('');

  const normalizeCurators = (list = []) =>
    list.map(c => ({
      reliability_score: 80,
      ...c,
      reliability_score: c.reliability_score ?? 80,
    }));

  const handleAuthSuccess = ({ token, user, fromRegister }) => {
    authDispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
    setShowAuthModal(false);
    if (fromRegister) {
      const childRaw = localStorage.getItem(`extra_child_profile_${user.id}`);
      if (childRaw) {
        try {
          const profile = JSON.parse(childRaw);
          authDispatch({ type: 'SET_CHILD_PROFILE', payload: profile });
        } catch {
          // ignore
        }
      }
      setShowChildProfile(true);
    }

    // 登录成功后，自动恢复一次待执行操作（Demo）
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      switch (action.type) {
        case 'MESSAGE_WISH_OWNER': {
          const wish = wishes.find(w => w.id === action.wishId);
          if (wish) {
            handleMessageWishOwner(wish);
          }
          break;
        }
        case 'START_BUDDY_GROUP': {
          const wish = wishes.find(w => w.id === action.wishId);
          if (wish) {
            handleStartBuddyGroup(wish);
          }
          break;
        }
        case 'CREATE_ACTIVITY_FROM_WISH': {
          const wish = wishes.find(w => w.id === action.wishId);
          if (wish) {
            handleCreateActivityFromWish(wish);
          }
          break;
        }
        case 'CONTACT_PLACE_OWNER': {
          const place = places.find(p => p.id === action.placeId);
          if (place) {
            handleContactPlaceOwner(place);
          }
          break;
        }
        case 'RESPOND_WISH_FOR_VENUE': {
          const wish = wishes.find(w => w.id === action.wishId);
          if (wish) {
            setRespondWishForVenue(wish);
          }
          break;
        }
        default:
          break;
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('extra_token');
    localStorage.removeItem('extra_current_user');
    if (auth.user?.id) {
      localStorage.removeItem(`extra_child_profile_${auth.user.id}`);
    }
    authDispatch({ type: 'LOGOUT' });
    setShowChildProfile(false);
    setShowAuthModal(false);
    setActiveTab('explore');
  };

  const updateDirectorScore = (delta) => {
    const stats =
      auth.user?.directorStats ||
      auth.userProfile.directorStats ||
      {};
    const currentScore =
      stats.reliability_score ?? calculateDirectorScore(stats);
    const nextScore = Math.max(0, Math.min(100, currentScore + delta));
    authDispatch({
      type: 'UPDATE_DIRECTOR_STATS',
      payload: {
        ...stats,
        reliability_score: nextScore,
      },
    });
    playScoreAnimation();
  };

  const bumpInterests = (action, category) => {
    const isJoin = action === 'join';
    const delta = isJoin ? 5 : 1;
    if (!category || !CATEGORY_INDEX_MAP.hasOwnProperty(category)) {
      // 未知分类暂不调整兴趣画像，避免误偏向某一维度
      return;
    }
    const idx = CATEGORY_INDEX_MAP[category];

    // 防止快速重复点击导致频繁 dispatch（仅对 view 行为节流）
    if (action === 'view') {
      const now = Date.now();
      const key = category || 'unknown';
      const last = lastViewBumpByCategoryRef.current.get(key) || 0;
      if (now - last < VIEW_THROTTLE_MS) return;
      lastViewBumpByCategoryRef.current.set(key, now);
    }

    authDispatch({ type: 'BUMP_INTERESTS', payload: { idx, delta, isJoin } });
  };

  const handleTabChange = (tab) => {
    if (tab === 'me' && !auth.token) {
      setShowAuthModal(true);
      return;
    }
    setShowSearch(false);
    setShowInspiration(false);
    setSelectedActivity(null);
    setSelectedPlace(null);
    setCurrentChat(null);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (activeTab !== 'me') return;
    const stats =
      auth.user?.directorStats ||
      auth.userProfile.directorStats ||
      {};
    const target =
      stats.reliability_score ?? calculateDirectorScore(stats);
    if (!Number.isFinite(target)) return;
    const start = displayReliability;
    const diff = target - start;
    if (diff === 0) return;
    const duration = 800;
    let frame;
    let startTime;

    const step = (ts) => {
      if (startTime == null) startTime = ts;
      const progress = Math.min(1, (ts - startTime) / duration);
      const eased = start + diff * (1 - Math.pow(1 - progress, 3));
      setDisplayReliability(Math.round(eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [activeTab, auth.user?.directorStats?.reliability_score, auth.userProfile.directorStats?.reliability_score]);

  const handleInspirationSameStyle = (item) => {
    // 一键同款：将灵感转化为心愿池里的 Proposal 草稿
    setActiveTab('wish');
    setShowInspiration(false);
    setWishForm(prev => ({
      ...prev,
      title: prev.title || `想要一场和这张图同款的 ${item.title || '小局'}`,
      scenes: prev.scenes && prev.scenes.length ? prev.scenes : [],
      vibes: prev.vibes && prev.vibes.length ? prev.vibes : item.moodTags?.slice(0, 2) || [],
    }));
    setInspirationLikes(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || item.baseLikes || 0) + 1,
    }));
  };

  const togglePlaceCapability = (tag) => {
    setPlaceCapabilitiesFilter(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const placeMatchesCapabilities = (p) => {
    if (!placeCapabilitiesFilter.length) return true;
    const caps = p.capabilityTags || [];
    return placeCapabilitiesFilter.every(tag => caps.includes(tag));
  };

  const playScoreAnimation = () => {
    setRadarPulse(true);
    setTimeout(() => {
      setRadarPulse(false);
    }, 1200);
  };

  const handleWishSubmit = async (e) => {
    e.preventDefault();
    if (!auth.token) {
      setWishError('请先登录后再发布心愿池。');
      setShowAuthModal(true);
      return;
    }
    if (!wishForm.title.trim()) {
      setWishError('请先写一句你的心愿～');
      return;
    }
    setWishError('');
    setWishLoading(true);
    const { childProfile, user } = auth;
    const payload = {
      title: wishForm.title,
      scenes: wishForm.scenes,
      vibes: wishForm.vibes,
      timePrefs: wishForm.timePrefs,
      area: wishForm.area,
      mode: wishForm.mode,
      isProposal: wishForm.isProposal,
      suggestedArea: wishForm.suggestedArea || wishForm.area,
      targetPeopleCount: wishForm.targetPeopleCount,
      childProfile,
    };
    const newWish = {
      id: Date.now(),
      title: wishForm.title,
      scenes: wishForm.scenes,
      vibes: wishForm.vibes,
      timePrefs: wishForm.timePrefs,
      area: wishForm.area,
      likeCount: 0,
      mode: wishForm.mode,
      isProposal: wishForm.isProposal,
      suggestedArea: wishForm.suggestedArea || wishForm.area,
      targetPeopleCount: wishForm.targetPeopleCount,
      participantCount: 1,
      ownerId: user?.id,
      ownerName: user?.nickname || user?.phone || '心愿发起人',
      status: 'OPEN',
      appointmentPlaceId: null,
      hasRecap: false,
      hasPromptedForRecap: false,
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
      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        const details = bodyText ? `：${bodyText.slice(0, 200)}` : '';
        throw new Error(`HTTP ${res.status}${details}`);
      }
      const data = await res.json();
      setMatchedCurators(normalizeCurators(data.curators || []));
      setWishes(prev => [newWish, ...prev]);
      setWishForm({
        title: '',
        scenes: [],
        vibes: [],
        timePrefs: [],
        area: '',
        mode: 'find_buddies',
        isProposal: false,
        suggestedArea: '',
        targetPeopleCount: 4,
      });
      // 轻微延迟后将视图滚动到心愿列表区域，方便用户看到新心愿
      window.requestAnimationFrame(() => {
        const el = document.getElementById('wish-list-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    } catch (err) {
      await fakeDelay(500);
      if (!isMountedRef.current) return;
      const reason = err instanceof Error ? err.message : String(err);
      setWishError(`发布失败（${reason}），心愿未保存，请稍后重试。`);
    } finally {
      if (isMountedRef.current) {
        setWishLoading(false);
      }
    }
  };

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState('');

  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState('');

  useEffect(() => {
    if (!userLocation) return;
    // 监听距离：当有 status 为 MATCHED 且尚未生成 Recap 的心愿，且距离约定场地 < 500m 时触发
    const target = wishes.find(
      (w) =>
        w.status === 'MATCHED' &&
        !w.hasRecap &&
        !w.hasPromptedForRecap &&
        w.appointmentPlaceId
    );
    if (!target) return;
    const place = places.find((p) => p.id === target.appointmentPlaceId);
    if (!place || place.lat == null || place.lng == null) return;
    const d = calculateDistanceKm(
      userLocation.lat,
      userLocation.lng,
      place.lat,
      place.lng
    );
    if (d != null && d < 0.5) {
      // 标记该心愿已提示过，避免同一心愿在当前位置反复弹窗
      setWishes(prev =>
        prev.map(w =>
          w.id === target.id ? { ...w, hasPromptedForRecap: true } : w
        )
      );
      setWishToRecap(target);
      setShowWishRecapDialog(true);
    }
  }, [userLocation, wishes, places]);

  useEffect(() => {
    let active = true;

    const loadActivities = async () => {
      setActivitiesLoading(true);
      setActivitiesError('');
      try {
        const res = await fetch('/api/activities');
        if (!res.ok) {
          const bodyText = await res.text().catch(() => '');
          const details = bodyText ? `：${bodyText.slice(0, 200)}` : '';
          throw new Error(`HTTP ${res.status}${details}`);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.activities;
        if (!Array.isArray(list)) throw new Error('invalid payload');
        if (!active) return;
        setActivities(list);
      } catch (err) {
        if (!active) return;
        const reason = err instanceof Error ? err.message : String(err);
        setActivities(DEFAULT_ACTIVITIES);
        setActivitiesError(`活动加载失败（${reason}），已展示演示数据。`);
      } finally {
        if (active) setActivitiesLoading(false);
      }
    };

    const loadPlaces = async () => {
      setPlacesLoading(true);
      setPlacesError('');
      try {
        const res = await fetch('/api/places');
        if (!res.ok) {
          const bodyText = await res.text().catch(() => '');
          const details = bodyText ? `：${bodyText.slice(0, 200)}` : '';
          throw new Error(`HTTP ${res.status}${details}`);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.places;
        if (!Array.isArray(list)) throw new Error('invalid payload');
        if (!active) return;
        setPlaces(list);
      } catch (err) {
        if (!active) return;
        const reason = err instanceof Error ? err.message : String(err);
        setPlaces(DEFAULT_PLACES);
        setPlacesError(`场域加载失败（${reason}），已展示演示数据。`);
      } finally {
        if (active) setPlacesLoading(false);
      }
    };

    Promise.allSettled([loadActivities(), loadPlaces()]);

    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    // 页面加载时尝试获取一次定位（模拟 uni.getLocation）
    requestUserLocation();
  }, []);

  const nearbyParents = useMemo(() => [
    { id: 1, name: "李漫漫", lat: 39.910, lng: 116.402, address: "朝阳区", interests: "摄影" },
    { id: 2, name: "陈小希", lat: 39.905, lng: 116.395, address: "朝阳区", interests: "自然" },
    { id: 3, name: "王大星", lat: 39.998, lng: 116.392, address: "海淀区", interests: "科学" },
  ], []);

  const inspirationImages = useMemo(() => {
    const items = [];

    const moodFromCategory = (cat) => {
      if (!cat) return ['多巴胺', '日常记录'];
      if (cat.includes('自然')) return ['森系', '户外呼吸'];
      if (cat.includes('艺术')) return ['多巴胺', '展览感'];
      if (cat.includes('科学')) return ['理工感', '实验氛围'];
      if (cat.includes('运动')) return ['放电', '活力感'];
      if (cat.includes('策展')) return ['策展感', '仪式感'];
      return ['多巴胺', '日常记录'];
    };

    const gearFromTags = (tags = []) => {
      const list = [];
      const all = (tags || []).join('、');
      if (all.includes('大草地') || all.includes('户外')) list.push('野餐垫 / 防潮垫');
      if (all.includes('自然') || all.includes('观察')) list.push('放大镜 / 采集本');
      if (all.includes('艺术') || all.includes('手作')) list.push('画材 / 手作工具');
      if (all.includes('摄影') || all.includes('光影')) list.push('相机 / 补光灯');
      if (list.length === 0) list.push('基础零食 / 水 / 备用衣物');
      return list;
    };

    // 来自官方/精选场域的案例图 -> 绑定 category_id（用场地 category 映射）
    places
      .filter(p => !p.isOwnerSubmitted)
      .forEach(p => {
        const moodTags = moodFromCategory(p.category);
        const gearList = gearFromTags(p.spaceTags);
        const categoryId = p.category || 'GENERAL';

        if (Array.isArray(p.caseImages) && p.caseImages.length > 0) {
          p.caseImages.forEach((url, idx) => {
            items.push({
              id: `place-${p.id}-case-${idx}`,
              url,
              title: p.name,
              categoryId,
              moodTags,
              gearList,
              baseLikes: 3,
            });
          });
        } else if (p.cover) {
          items.push({
            id: `place-${p.id}-cover`,
            url: p.cover,
            title: p.name,
            categoryId,
            moodTags,
            gearList,
            baseLikes: 2,
          });
        }
      });

    // 场地主入驻场地上传的图片 -> 偏 PRIVATE / 生活方式
    places
      .filter(p => p.isOwnerSubmitted)
      .forEach(p => {
        const moodTags = ['生活方式', '社区感'];
        const gearList = gearFromTags(p.spaceTags);
        const categoryId = p.category || 'LIFESTYLE';

        if (Array.isArray(p.caseImages) && p.caseImages.length > 0) {
          p.caseImages.forEach((url, idx) => {
            items.push({
              id: `owner-${p.id}-case-${idx}`,
              url,
              title: p.name,
              categoryId,
              moodTags,
              gearList,
              baseLikes: 1,
            });
          });
        } else if (p.cover) {
          items.push({
            id: `owner-${p.id}-cover`,
            url: p.cover,
            title: p.name,
            categoryId,
            moodTags,
            gearList,
            baseLikes: 1,
          });
        }
      });

    // 精选活动封面 -> 偏场景化 Inspiration
    activities.forEach(a => {
      if (a.cover) {
        const moodTags = moodFromCategory(a.category);
        const gearList = ['手机 / 相机', '简单道具'];
        const categoryId = a.category || 'ACTIVITY';
        items.push({
          id: `act-${a.id}`,
          url: a.cover,
          title: a.title,
          categoryId,
          moodTags,
          gearList,
          baseLikes: 5,
        });
      }
    });

    return items.slice(0, 20);
  }, [places, activities]);

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

  const [selectedPlace, setSelectedPlace] = useState(null);

  const isOutdoorOrPetActivity = (activity) => {
    const cat = activity.category || '';
    const title = activity.title || '';
    const labels = activity.labels || [];
    const text = `${cat} ${title} ${labels.join(' ')}`;
    if (cat === '非常自然') return true;
    return /户外|公园|露营|野餐|宠物|猫|狗/i.test(text);
  };

  // 统一在这里根据局长信用分应用「免押金 / 双倍押金 / 同期开局上限」等规则
  const createActivityWithPrivileges = (activity) => {
    const stats =
      auth.user?.directorStats ||
      auth.userProfile.directorStats ||
      {};
    const score =
      stats.reliability_score ?? calculateDirectorScore(stats);
    const priv = getDirectorPrivileges(score);

    // 1）同期开局数量限制（例如信用分 < 70 时只允许 1 场）
    if (priv.limitActive) {
      const ownerId = auth.user?.id || auth.userProfile.id;
    const activeCount = activities.filter(a =>
        a.ownerId === ownerId &&
        a.lifecycleStatus &&
        a.lifecycleStatus !== 'FINISHED' &&
        a.lifecycleStatus !== 'CANCELED' &&
        a.lifecycleStatus !== 'ARCHIVED'
      ).length;

      if (activeCount >= priv.limitActive) {
        window.alert(
          '当前信用分较低，同期开局数量已达上限，请先结束或取消已有活动后再创建新局（Demo）。'
        );

        const msg = createSystemMessage(
          '开局受限提醒',
          '由于当前局长信用分较低，本次未能创建新局：同期开局不得超过 1 场（Demo）。'
        );
        setConversations(prev => {
          const existing = prev.find(c => c.id === 'sys-director-priv');
          if (existing) {
            const updated = {
              ...existing,
              messages: [...(existing.messages || []), msg],
              lastMsg: msg.text,
              time: '刚刚',
            };
            return prev.map(c => (c.id === existing.id ? updated : c));
          }
          return [
            {
              id: 'sys-director-priv',
              name: 'EXTRA 系统通知',
              lastMsg: msg.text,
              time: '刚刚',
              unread: 1,
              type: 'system',
              messages: [msg],
            },
            ...prev,
          ];
        });

        return false;
      }
    }

    // 2）根据信用分计算保证金：高信用免押金，低信用双倍保证金
    const baseDeposit = 200; // Demo 基础保证金金额（单位：元）
    let depositRequired = 0;
    let depositMultiplier = 1;

    if (priv.depositFree) {
      depositRequired = 0;
    } else if (priv.doubleDeposit) {
      depositMultiplier = 2;
      depositRequired = baseDeposit * 2;
    } else {
      depositRequired = baseDeposit;
    }

    const activityWithPolicy = {
      ...activity,
      depositRequired,
      depositMultiplier,
      depositStatus: depositRequired > 0 ? 'UNPAID' : 'WAIVED',
    };

    setActivities(prev => [activityWithPolicy, ...prev]);
    setSelectedActivity(activityWithPolicy);

    // 3）需要缴纳保证金时，弹出模拟支付弹窗
    if (depositRequired > 0) {
      setDepositActivity(activityWithPolicy);
      setDepositAmount(depositRequired);
      setDepositError('');
    }

    return true;
  };

  const handleCreateActivity = (activity) => {
    if (isOutdoorOrPetActivity(activity)) {
      // 每次进入安全协议弹窗时都重置安全勾选状态，避免上一次的选择残留
      const base = { ...activity };
      delete base._agreedSafety;
      delete base._confirmedInsurance;
      setPendingActivity({
        ...base,
        _agreedSafety: false,
        _confirmedInsurance: false,
      });
      setShowSafetyModal(true);
      return;
    }
    createActivityWithPrivileges(activity);
  };

  const handleCreateActivityFromPlace = (place) => {
    if (!auth.token) {
      setShowAuthModal(true);
      return;
    }
    const now = Date.now();
    const categoryMap = {
      '自然户外': '非常自然',
      '艺术策展': '非常艺术',
      '策展零售': '非常策展',
      '城市空间': '非常策展',
    };
    const cat = categoryMap[place.category] || '非常策展';
    const newActivity = {
      id: now,
      ownerId: auth.user?.id,
      isOfficial: place.ownershipType === 'ENTERPRISE',
      tag: '场地变局',
      category: cat,
      title: `基于「${place.name}」的亲子局（Demo）`,
      host: auth.user?.nickname || auth.user?.phone || '匿名局长',
      price: 0,
      capacity: 10,
      joined: 0,
      lifecycleStatus: 'ONLINE',
      stats: [70, 60, 50, 60, 80],
      cover: place.cover,
      location: place.address || place.city || place.name,
      lat: place.lat,
      lng: place.lng,
      statusText: 'Demo · 刚刚创建',
      matchScore: 88,
      labels: ['场地灵感', place.category].filter(Boolean),
      venueType:
        place.ownershipType === 'COMMERCIAL' || place.ownershipType === 'ENTERPRISE'
          ? 'COMMERCIAL'
          : place.ownershipType === 'PRIVATE'
          ? 'PRIVATE'
          : 'PUBLIC',
    };
    handleCreateActivity(newActivity);
  };

  useEffect(() => {
    if (!currentChat) return;
    const updated = conversations.find((c) => c.id === currentChat.id);
    if (updated && updated !== currentChat) {
      setCurrentChat(updated);
    }
  }, [conversations, currentChat]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) {
      return { activities: [], places: [], people: [], topics: [] };
    }
    const lower = q.toLowerCase();

    const activitiesMatches = activities.filter((a) => {
      const texts = [
        a.title,
        a.description,
        a.area,
        a.category,
        ...(a.labels || []),
      ].filter(Boolean).map(String);
      return texts.some(t => t.includes(q) || t.toLowerCase().includes(lower));
    });

    const placesMatches = places.filter((p) => {
      const texts = [
        p.name,
        p.suggestedUse,
        p.area,
        p.ownerName,
        ...(p.tags || []),
      ].filter(Boolean).map(String);
      return texts.some(t => t.includes(q) || t.toLowerCase().includes(lower));
    });

    const peopleMap = new Map();
    activities.forEach(a => {
      if (a.host) {
        peopleMap.set(a.host, { name: a.host, role: '活动发起人', from: 'activity' });
      }
    });
    conversations.forEach(c => {
      if (c.type === 'private' && c.name) {
        peopleMap.set(c.name, { name: c.name, role: '已在对话的家长/局长', from: 'chat', convoId: c.id });
      }
    });
    (matchedCurators || []).forEach(c => {
      peopleMap.set(c.name, { name: c.name, role: c.title || '推荐局长', from: 'curator' });
    });
    const peopleAll = Array.from(peopleMap.values());
    const peopleMatches = peopleAll.filter(p =>
      [p.name, p.role].filter(Boolean).some(t => t.includes(q) || t.toLowerCase().includes(lower))
    );

    const topicSet = new Set();
    activities.forEach(a => (a.labels || []).forEach(l => topicSet.add(l)));
    wishes.forEach(w => {
      (w.scenes || []).forEach(s => topicSet.add(s));
      (w.vibes || []).forEach(v => topicSet.add(v));
    });
    const topicsAll = Array.from(topicSet);
    const topicsMatches = topicsAll.filter(t => t.includes(q) || t.toLowerCase().includes(lower));

    return {
      activities: activitiesMatches.slice(0, 5),
      places: placesMatches.slice(0, 5),
      people: peopleMatches.slice(0, 5),
      topics: topicsMatches.slice(0, 8),
    };
  }, [searchQuery, activities, places, conversations, matchedCurators, wishes]);

  const addRecentSearch = (term) => {
    const t = (term || '').trim();
    if (!t) return;
    setRecentSearches((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)];
      return next.slice(0, 5);
    });
  };

  const markConversationRead = (id) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const handleWishLike = (id) => {
    setWishes(prev =>
      prev.map(w =>
        w.id === id
          ? {
              ...w,
              likeCount: (w.likeCount || 0) + 1,
              participantCount: (w.participantCount || 1) + 1,
            }
          : w
      )
    );
  };

  const handleMessageWishOwner = (wish) => {
    if (!auth.token) {
      setPendingAction({ type: 'MESSAGE_WISH_OWNER', wishId: wish.id });
      setShowAuthModal(true);
      return;
    }
    const convId = `wish-owner-${wish.id}`;
    const existing = conversations.find(c => c.id === convId);
    if (existing) {
      setCurrentChat(existing);
      return;
    }
    const firstMessage = createSystemMessage(
      '心愿沟通',
      `你正在和心愿发起人「${wish.ownerName || '这位家长'}」聊天，可以先确认大致时间、人数和预算，再决定是否一键领取或一起成团。`
    );
    const newConv = {
      id: convId,
      name: wish.ownerName || '心愿发起人',
      lastMsg: firstMessage.text,
      time: '刚刚',
      unread: 0,
      type: 'private',
      messages: [firstMessage],
      fromWishId: wish.id,
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentChat(newConv);
  };

  const handleStartBuddyGroup = (wish) => {
    if (!auth.token) {
      setPendingAction({ type: 'START_BUDDY_GROUP', wishId: wish.id });
      setShowAuthModal(true);
      return;
    }
    const convId = `wish-${wish.id}`;
    const existing = conversations.find(c => c.id === convId);
    if (existing) {
      setCurrentChat(existing);
      return;
    }
    const sysMsg = createSystemMessage(
      '心愿成团',
      `你正在基于心愿「${wish.title}」聊天，可以和其他家长一起确定时间、地点和费用后成团。`
    );
    const newConv = {
      id: convId,
      name: `心愿成团 · ${wish.area || '待定地点'}`,
      lastMsg: sysMsg.text,
      time: '刚刚',
      unread: 0,
      type: 'group',
      isGroup: true,
      fromWishId: wish.id,
      messages: [sysMsg],
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentChat(newConv);

    // 心愿侧记录已建群 / 成团中
    setWishes(prev =>
      prev.map(w =>
        w.id === wish.id
          ? {
              ...w,
              status: w.status === 'OPEN' ? 'GROUPING' : w.status,
              hasGroupChat: true,
            }
          : w
      )
    );
  };

  const handleCreateActivityFromWish = (wish) => {
    if (!auth.token) {
      setPendingAction({ type: 'CREATE_ACTIVITY_FROM_WISH', wishId: wish.id });
      setShowAuthModal(true);
      return;
    }

    // ① 局长领取心愿：将心愿从 OPEN 推进到 IN_PROGRESS
    setWishes(prev =>
      prev.map(w =>
        w.id === wish.id
          ? {
              ...w,
              status: w.status === 'OPEN' ? 'IN_PROGRESS' : w.status,
            }
          : w
      )
    );

    const now = Date.now();
    const newActivity = {
      id: now,
      ownerId: auth.user?.id,
      sourceWishId: wish.id,
      tag: '心愿变局',
      category: wish.scenes.includes('公园野餐') ? '非常自然' : '非常艺术',
      title: wish.title.slice(0, 40),
      host: auth.user?.nickname || auth.user?.phone || '匿名局长',
      price: 0,
      capacity: 5,
      joined: 0,
      lifecycleStatus: 'ONLINE',
      stats: [70, 60, 60, 50, 50],
      cover:
        'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      location: wish.area || '城市 · 待协商',
      statusText: 'FREE · 心愿发起中',
      matchScore: 88,
      labels: ['心愿变局', ...(wish.scenes || [])].slice(0, 3),
      venueType: 'PUBLIC',
    };
    handleCreateActivity(newActivity);

    // ② 活动创建成功：将对应心愿标记为已基于该心愿生成活动
    setWishes(prev =>
      prev.map(w =>
        w.id === wish.id
          ? {
              ...w,
              status: 'ACTIVITY_CREATED',
            }
          : w
      )
    );
    return newActivity;
  };

  const createPlaceConversation = (place, applyPayload) => {
    const convId = `place-${place.id}`;
    const existing = conversations.find(c => c.id === convId);
    const summaryParts = [];
    if (applyPayload?.families) summaryParts.push(`预计 ${applyPayload.families} 组家庭`);
    if (applyPayload?.dateOption === 'weekend') summaryParts.push('周末白天优先');
    if (applyPayload?.dateOption === 'weekday_evening') summaryParts.push('工作日晚上可谈');
    if (applyPayload?.dateOption === 'holiday') summaryParts.push('节假日优先');
    if (Array.isArray(applyPayload?.equipments) && applyPayload.equipments.length) {
      summaryParts.push(`设备需求：${applyPayload.equipments.length} 项`);
    }
    const summaryText =
      summaryParts.length > 0
        ? summaryParts.join('，')
        : '还没有填写具体需求，可以先简单自我介绍。';

    const contactLines = [];
    if (place.contactName) contactLines.push(`联系人：${place.contactName}`);
    if (place.contactPhone) contactLines.push(`手机：${place.contactPhone}`);
    if (place.contactWeChat) contactLines.push(`微信：${place.contactWeChat}`);
    if (place.availableSlots) contactLines.push(`可预约时段：${place.availableSlots}`);

    const firstMessage = createSystemMessage(
      '合作意向',
      `你已为场地「${place.name}」提交了一次预约意向金，基础需求为：${summaryText}${
        contactLines.length ? `。\n\n场地主入驻时提供的信息（供你参考，无需重复询问）：\n${contactLines.join('\n')}` : ''
      }`
    );

    if (existing) {
      const updated = {
        ...existing,
        messages: [...(existing.messages || []), firstMessage],
        lastMsg: firstMessage.text,
        time: firstMessage.time,
      };
      setConversations(prev => prev.map(c => (c.id === convId ? updated : c)));
      setCurrentChat(updated);
      return;
    }

    const newConv = {
      id: convId,
      name: `${place.name} 场地主`,
      lastMsg: firstMessage.text,
      time: '刚刚',
      unread: 0,
      type: 'private',
      isPlaceConversation: true,
      placeId: place.id,
      messages: [firstMessage],
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentChat(newConv);
  };

  const handleContactPlaceOwner = (place) => {
    if (!auth.token) {
      setPendingAction({ type: 'CONTACT_PLACE_OWNER', placeId: place.id });
      setShowAuthModal(true);
      return;
    }
    // 如果该场地已提交过合作申请，则优先跳转到已有的场地会话，避免重复提交
    if (place.hasApplied) {
      const convId = `place-${place.id}`;
      const existing = conversations.find(c => c.id === convId);
      if (existing) {
        setCurrentChat(existing);
        return;
      }
    }
    setApplyPlace(place);
  };

  const handleMarkCooperation = (session) => {
    if (!auth.token) {
      setShowAuthModal(true);
      return;
    }
    setCooperationSession(session);
    setCooperationAmount('');
    setCooperationRate(10);
    setCooperationError('');
  };

  const confirmCooperation = () => {
    if (!cooperationSession) return;
    const total = Number(cooperationAmount);
    const rate = Number(cooperationRate);
    if (!Number.isFinite(total) || total <= 0) {
      setCooperationError('请填写有效的预估金额');
      return;
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setCooperationError('请填写 0-100 之间的抽佣比例');
      return;
    }
    const commissionAmount = Math.round(total * rate) / 100;
    const session = cooperationSession;

    // 会话层：追加系统消息 + 标记已合作
    const summaryText = `预估成交金额 ¥${total.toFixed(0)}，平台抽佣 ${rate.toFixed(
      1
    )}%（约 ¥${commissionAmount.toFixed(0)}，Demo）。`;
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== session.id) return c;
        const baseMsg = createSystemMessage(
          '合作标记',
          '局长已标记与该场地达成合作，平台后续可基于该记录进行抽佣与支持（Demo）。'
        );
        const extraMsg = createSystemMessage('合作预估', summaryText);
        return {
          ...c,
          hasCooperation: true,
          messages: [...(c.messages || []), baseMsg, extraMsg],
          lastMsg: extraMsg.text,
          time: extraMsg.time,
        };
      })
    );

    // 结算层：记录一条合作结算 Demo
    const record = {
      id: `coop-${Date.now()}`,
      conversationId: session.id,
      placeId: session.placeId,
      placeName: session.name,
      directorId: auth.user?.id,
      totalAmount: total,
      commissionRate: rate,
      commissionAmount,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };
    setCooperations(prev => [record, ...prev]);

    // 将最近一笔该场地的 Venue Order 从 PENDING_VENUE 推进到 CONFIRMED（独立交易状态机 Demo）
    setOrders(prev => {
      const idx = prev.findIndex(
        o =>
          o.placeId === session.placeId &&
          o.directorId === auth.user?.id &&
          o.status === 'PENDING_VENUE'
      );
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        status: 'CONFIRMED',
      };
      return next;
    });

    // 业务侧：增加场地与局长的合作次数、成交额等统计（Demo）
    if (session.placeId != null) {
      setPlaces(prev =>
        prev.map(p =>
          p.id === session.placeId
            ? {
                ...p,
                cooperationCount: (p.cooperationCount || 0) + 1,
                cooperationTotalAmount: (p.cooperationTotalAmount || 0) + total,
                lastCooperationAt: record.createdAt,
              }
            : p
        )
      );
    }

    // 局长侧：为局长增加一次合作记录（可用于后续展示“与多少场地有合作关系”）
    const stats =
      auth.user?.directorStats ||
      auth.userProfile.directorStats ||
      {};
    authDispatch({
      type: 'UPDATE_DIRECTOR_STATS',
      payload: {
        ...stats,
        total_cooperations: (stats.total_cooperations || 0) + 1,
      },
    });

    // 重置弹窗
    setCooperationSession(null);
    setCooperationAmount('');
    setCooperationRate(10);
    setCooperationError('');
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  const renderExploreLegacy = () => {
    let filtered =
      exploreFilter === '全部'
        ? activities
        : activities.filter(a => a.category && a.category === exploreFilter);
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
              onClick={() => {
                setShowInspiration(true);
                setHasNewInspiration(false);
              }}
              className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 relative"
            >
              <ImageIcon size={18} />
              {hasNewInspiration && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  1
                </span>
              )}
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
                <div key={i} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm animate-pulse">
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
                <img src={item.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1.5">
                    <Sparkles size={10} className="text-amber-400" />
                    <span className="text-[9px] font-black text-white italic">AI 匹配度 {item.matchScore}%</span>
                  </div>
                  <div className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                      <span className="text-[9px] font-black text-white italic">
                        {item.category === '非常艺术' && 'EXTRA ART'}
                        {item.category === '非常自然' && 'EXTRA NATURE'}
                        {item.category === '非常科学' && 'EXTRA SCIENCE'}
                        {item.category === '非常运动' && 'EXTRA SPORT'}
                        {item.category === '非常策展' && 'EXTRA CURATION'}
                        {(!item.category || !['非常艺术','非常自然','非常科学','非常运动','非常策展'].includes(item.category)) && 'EXTRA'}
                      </span>
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
                  <h3 className="text-lg font-black text-slate-900 leading-tight mb-3 group-hover:text-[#108542] transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.host}`} alt="host" />
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

  const renderExplore = () => (
    <ExploreTabView renderLegacy={renderExploreLegacy} />
  );

  const renderPlaceLegacy = () => {
    const visiblePlaces = places.filter(p => !p.hiddenInPlaceList);
    const officialPlaces = visiblePlaces.filter(p => !p.isOwnerSubmitted && placeMatchesCapabilities(p));
    const ownerPlaces = visiblePlaces.filter(p => p.isOwnerSubmitted && placeMatchesCapabilities(p));

    const hotProposalWishes = wishes.filter(w => {
      if (!w.isProposal) return false;
      const target = w.targetPeopleCount || 0;
      const joined = w.participantCount || 0;
      if (!target) return false;
      return joined / target >= 0.75;
    });

    const formatDistance = (p) => {
      if (userLocation && p.lat != null && p.lng != null) {
        const d = calculateDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng);
        if (d == null) return p.distance || '';
        if (d < 1) return `${Math.round(d * 1000)}m`;
        return `${d.toFixed(1)}km`;
      }
      return p.distance || '';
    };

    const extractBizTag = (p) => {
      if (p.businessArea) return p.businessArea;
      if (p.address && p.address.includes('·')) {
        const parts = p.address.split('·').map(s => s.trim());
        return parts[1] || parts[0];
      }
      return p.city || '城市待定';
    };

    const officialCols = [[], []];
    officialPlaces.forEach((p, idx) => {
      officialCols[idx % 2].push(p);
    });
    const ownerCols = [[], []];
    ownerPlaces.forEach((p, idx) => {
      ownerCols[idx % 2].push(p);
    });

    return (
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-slate-50 animate-in fade-in duration-300">
        <header className="px-6 pt-14 pb-8 bg-white border-b flex justify-between items-end sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-black italic mb-1 uppercase tracking-tighter">Energy Spaces</h1>
            <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">寻找最契合你画像的高能量空间</p>
            {locationError && (
              <p className="mt-1 text-[9px] text-amber-500 font-black">
                {locationError}
              </p>
            )}
          </div>
          <div className="flex gap-2">
              <button 
                type="button"
                aria-label="查看与我的距离"
                onClick={requestUserLocation}
                className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all bg-slate-50 text-slate-400 border-slate-100 active:scale-95"
              >
                <Navigation size={18}/>
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

        <div className="px-6 py-6 space-y-4">
          {hotProposalWishes.length > 0 && (
            <div className="mb-3 p-3 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                  心愿看板 · 高热度待办提案
                </p>
                <span className="text-[9px] font-black text-emerald-600">
                  {hotProposalWishes.length} 条
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {hotProposalWishes.map(w => (
                  <div
                    key={w.id}
                    className="p-2.5 rounded-2xl bg-white/80 border border-emerald-100 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-slate-900 line-clamp-2">
                        {w.title}
                      </p>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black">
                        提案心愿
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold">
                      建议区域：{w.suggestedArea || w.area || '待定区域'}
                    </p>
                    <p className="text-[9px] text-emerald-700 font-black">
                      热度：{w.participantCount || 1}/{w.targetPeopleCount || 4} 组家庭已“我也想”
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-slate-400 font-black">
                        热门需求，待场地入驻
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!auth.token) {
                            setPendingAction({ type: 'RESPOND_WISH_FOR_VENUE', wishId: w.id });
                            setShowAuthModal(true);
                            return;
                          }
                          setRespondWishForVenue(w);
                        }}
                        className="px-2.5 py-1 rounded-full bg-[#108542] text-white text-[9px] font-black active:scale-95 transition-all"
                      >
                        我能提供场地
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FilterBar
            options={PLACE_CAPABILITY_OPTIONS}
            selected={placeCapabilitiesFilter}
            onToggle={togglePlaceCapability}
          />
          {placesError && (
            <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-black text-amber-700">{placesError}</p>
            </div>
          )}

          {placesLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm animate-pulse">
                  <div className="h-28 bg-slate-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {officialPlaces.length > 0 && (
                <>
                  <div className="mb-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Extra能量秀场
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {officialCols.map((col, colIdx) => (
                      <div key={colIdx} className="flex-1 flex flex-col gap-3">
                        {col.map(p => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPlace(p)}
                            className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <div className="h-28 overflow-hidden relative">
                              <img src={p.cover} className="w-full h-full object-cover" alt="place" />
                              {p.ownershipType === 'ENTERPRISE' && (
                                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[8px] font-black">
                                  官方合作
                                </div>
                              )}
                            </div>
                            <div className="p-3 space-y-1">
                              <h4 className="font-black text-[12px] truncate">{p.name}</h4>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                                {p.category}
                              </p>
                              <p className="text-[9px] text-slate-400">
                                商圈：{extractBizTag(p)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {ownerPlaces.length > 0 && (
                <>
                  <div className="mt-3 mb-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      场地主入驻 · 灵感场地
                    </p>
                  </div>
                  <div className="space-y-3">
                    {ownerPlaces.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlace(p)}
                        className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="h-40 overflow-hidden">
                          <img src={p.cover} className="w-full h-full object-cover" alt={p.name} />
                        </div>
                        <div className="p-4 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-black text-[13px] truncate">{p.name}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase flex-shrink-0">
                              BY 场地主
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter flex items-center gap-1">
                            <MapPin size={10} />
                            {formatDistance(p)}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            商圈：{extractBizTag(p)}
                          </p>
                          {p.suggestedUse && (
                            <p className="text-[9px] text-slate-500 font-bold line-clamp-2 mt-0.5">
                              {p.suggestedUse}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderPlace = () => (
    <PlaceTabView renderLegacy={renderPlaceLegacy} />
  );

  const renderWishLegacy = () => (
    <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-slate-50 animate-in fade-in duration-300">
      <header className="px-6 pt-14 pb-4 bg-white border-b flex justify-between items-end sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black italic mb-1 uppercase tracking-tighter">EXTRA WISH</h1>
          <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">
            REAL PARENT DESIRES · IDEA FEED
          </p>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        <form className="space-y-4 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm" onSubmit={handleWishSubmit}>
          <h2 className="text-sm font-black mb-2">发布一个心愿</h2>

          {/* 心愿类型：找搭子 / 找局长 */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
              这是一个什么类型的心愿？
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWishForm(prev => ({ ...prev, mode: 'find_buddies' }))}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black border ${
                  wishForm.mode === 'find_buddies'
                    ? 'bg-[#108542] text-white border-[#108542]'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                我在找搭子一起去
              </button>
              <button
                type="button"
                onClick={() => setWishForm(prev => ({ ...prev, mode: 'find_curator' }))}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black border ${
                  wishForm.mode === 'find_curator'
                    ? 'bg-[#108542] text-white border-[#108542]'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                我在找局长来组织
              </button>
            </div>
          </div>

          {/* 一句话心愿 */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="text-slate-400 mt-1">
              <Target size={14} />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                一句话心愿 *
              </p>
              <input
                value={wishForm.title}
                onChange={e =>
                  setWishForm(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="例如：周六想去徐汇滨江溜娃+喝咖啡，有人一起吗？"
                className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* 提案型心愿：先攒人再找场地 */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
              没有现成场地？先发一个活动提案
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  id="wish-is-proposal"
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-slate-300"
                  checked={wishForm.isProposal}
                  onChange={(e) =>
                    setWishForm(prev => ({ ...prev, isProposal: e.target.checked }))
                  }
                />
                <label
                  htmlFor="wish-is-proposal"
                  className="text-[10px] font-black text-slate-600"
                >
                  这是一个“活动提案”（先攒人，等场地来找你）
                </label>
              </div>
              {wishForm.isProposal && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black">
                  需求驱动选址 · Demo
                </span>
              )}
            </div>
            {wishForm.isProposal && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                    建议区域（可模糊）
                  </p>
                  <input
                    value={wishForm.suggestedArea}
                    onChange={e =>
                      setWishForm(prev => ({ ...prev, suggestedArea: e.target.value }))
                    }
                    placeholder="如：徐汇滨江一带 / 朝阳公园附近"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                    目标募集人数
                  </p>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={wishForm.targetPeopleCount}
                    onChange={e =>
                      setWishForm(prev => ({
                        ...prev,
                        targetPeopleCount: Number(e.target.value) || 2,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 场景 & 氛围标签 */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                大致场景（可多选）
              </p>
              <div className="flex flex-wrap gap-2">
                {WISH_SCENE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setWishForm(prev => ({
                        ...prev,
                        scenes: prev.scenes.includes(opt)
                          ? prev.scenes.filter(v => v !== opt)
                          : [...prev.scenes, opt],
                      }));
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                      wishForm.scenes.includes(opt)
                        ? 'bg-[#108542] text-white border-[#108542]'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {wishForm.scenes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {wishForm.scenes.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setWishForm(prev => ({
                          ...prev,
                          scenes: prev.scenes.filter(v => v !== tag),
                        }))
                      }
                      className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[9px] font-black text-slate-500 flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <span className="text-[9px] text-slate-400">×</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={customScene}
                  onChange={(e) => setCustomScene(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = customScene.trim();
                      if (!val) return;
                      setWishForm(prev => ({
                        ...prev,
                        scenes: prev.scenes.includes(val) ? prev.scenes : [...prev.scenes, val],
                      }));
                      setCustomScene('');
                    }
                  }}
                  placeholder="其他场景，自定义输入后回车添加"
                  className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-1 text-[10px] outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                氛围偏好（可多选）
              </p>
              <div className="flex flex-wrap gap-2">
                {WISH_VIBE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setWishForm(prev => ({
                        ...prev,
                        vibes: prev.vibes.includes(opt)
                          ? prev.vibes.filter(v => v !== opt)
                          : [...prev.vibes, opt],
                      }));
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                      wishForm.vibes.includes(opt)
                        ? 'bg-[#108542] text-white border-[#108542]'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {wishForm.vibes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {wishForm.vibes.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setWishForm(prev => ({
                          ...prev,
                          vibes: prev.vibes.filter(v => v !== tag),
                        }))
                      }
                      className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[9px] font-black text-slate-500 flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <span className="text-[9px] text-slate-400">×</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={customVibe}
                  onChange={(e) => setCustomVibe(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = customVibe.trim();
                      if (!val) return;
                      setWishForm(prev => ({
                        ...prev,
                        vibes: prev.vibes.includes(val) ? prev.vibes : [...prev.vibes, val],
                      }));
                      setCustomVibe('');
                    }
                  }}
                  placeholder="其他氛围，自定义输入后回车添加"
                  className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-1 text-[10px] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 时间 & 区域 */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                什么时候方便
              </p>
              <div className="flex flex-wrap gap-2">
                {WISH_TIME_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setWishForm(prev => ({
                        ...prev,
                        timePrefs: prev.timePrefs.includes(opt)
                          ? prev.timePrefs.filter(v => v !== opt)
                          : [...prev.timePrefs, opt],
                      }))
                    }
                    className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                      wishForm.timePrefs.includes(opt)
                        ? 'bg-[#108542] text-white border-[#108542]'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <div className="text-slate-400 mt-1">
                <MapPin size={14} />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                  大致区域（可选填）
                </p>
                <input
                  value={wishForm.area}
                  onChange={e =>
                    setWishForm(prev => ({ ...prev, area: e.target.value }))
                  }
                  placeholder="例如：徐汇滨江 / 朝阳公园 / 线上"
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
            className="w-full py-4 bg-[#108542] text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {wishLoading && <Loader2 size={16} className="animate-spin" />}
            发布心愿
          </button>
        </form>

        {/* 心愿池 */}
        {wishes.length > 0 && (
          <div className="space-y-3" id="wish-list-section">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                心愿池
              </p>
              <span className="text-[9px] text-slate-300 font-black">{wishes.length} 条</span>
            </div>
            <div className="space-y-3">
              {wishes.map(w => (
                <div
                  key={w.id}
                  className="p-4 bg-white rounded-[24px] border border-slate-100 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-bold text-slate-900 flex-1">{w.title}</p>
                    <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-400">
                      {w.mode === 'find_curator' ? '找局长' : '找搭子'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[...(w.scenes || []), ...(w.vibes || []), w.area]
                      .filter(Boolean)
                      .slice(0, 4)
                      .map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-slate-50 text-[9px] font-black text-slate-500 border border-slate-100"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleWishLike(w.id)}
                      className="text-[9px] font-black text-slate-400"
                    >
                      我也想 · {w.likeCount || 0}
                    </button>
                    {w.mode === 'find_buddies' ? (
                      <button
                        type="button"
                        onClick={() => handleStartBuddyGroup(w)}
                        className="text-[9px] font-black text-[#108542]"
                      >
                        一键成团 · 开个群聊
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleMessageWishOwner(w)}
                          className="text-[9px] font-black text-slate-400"
                        >
                          私信发起人
                        </button>
                        <button
                          type="button"
                          onClick={() => setWishToCurate(w)}
                          className="text-[9px] font-black text-[#108542]"
                        >
                          一键领取 · 发起组局
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderWish = () => (
    <WishView renderLegacy={renderWishLegacy} />
  );

  const renderFeedLegacy = () => {
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
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
              {feedType === '系统通知' ? '暂无系统通知' : '暂无消息'}
            </p>
            <p className="mt-2 text-[10px] font-bold text-slate-300">
              去「组局广场」认识新搭子，或等待新的通知到来。
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    );
  };

  const renderFeed = () => (
    <FeedTabView renderLegacy={renderFeedLegacy} />
  );

  const renderMeLegacy = () => (
    <div className="flex-1 bg-white pt-16 px-8 animate-in fade-in duration-300 overflow-y-auto pb-32 no-scrollbar">
       <div className="flex justify-between items-start mb-8">
          <div className="relative group">
            <div className="w-20 h-20 rounded-[28px] bg-slate-100 overflow-hidden border-2 border-white shadow-xl relative transition-transform group-hover:scale-105 active:scale-95">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Star" alt="me" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 px-2 py-0.5 rounded-lg text-[8px] font-black border border-white shadow-sm flex items-center gap-1">
              <ShieldCheck size={10} /> 非常认证
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="切换语言或地区设置"
              className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 active:scale-90 transition-all"
            >
              <Globe size={18}/>
            </button>
            <button
              type="button"
              aria-label="打开个人设置"
              className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 active:scale-90 transition-all"
            >
              <Settings size={18}/>
            </button>
          </div>
       </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-black text-slate-900">
            {auth.user?.nickname || auth.userProfile.name}
          </h2>
          <div className="px-2 py-0.5 bg-green-50 text-[#108542] rounded-full text-[8px] font-black tracking-widest italic uppercase">
            {auth.token ? '已登录' : '游客'}
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-300 tracking-widest uppercase italic">
          EXTRA PARENT SINCE 2024
        </p>
      </div>

      <div className="space-y-6 mb-6">
        {/* 我参与的局 · 参与者视角 */}
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            我参与的局
          </h3>
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black text-white/40 tracking-[0.2em] mb-1 uppercase">EP 能量资产</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black italic tabular-nums">{auth.userProfile.epScore}</span>
                  <span className="text-green-400 text-[10px] font-black italic">POINTS</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-white/40 tracking-[0.2em] mb-1 uppercase">当前等级</p>
                <span className="text-amber-400 text-sm font-black italic tracking-widest uppercase">Level {auth.userProfile.level}</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10"><Award size={80} /></div>
            <p className="mt-4 text-[9px] text-white/80 font-black flex items-center gap-1">
              <UserPlus size={12} className="opacity-80" />
              本月已邀请
              <span className="mx-1 text-white">{auth.userProfile.invites}</span>
              位新家长加入 EXTRA。
            </p>
          </div>

            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col justify-between">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                娃的兴趣雷达
                <span className="text-[9px] text-[#108542] font-black italic">
                  平均
                  {((auth.userProfile.stats.reduce((a, b) => a + b, 0) / auth.userProfile.stats.length) | 0)}
                  %
                </span>
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <RadarChart stats={auth.userProfile.stats} size={90} />
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    艺术
                  </span>
                  <span className="absolute top-[14px] -right-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    自然
                  </span>
                  <span className="absolute bottom-[10px] -right-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    科学
                  </span>
                  <span className="absolute bottom-[10px] -left-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    运动
                  </span>
                  <span className="absolute top-[14px] -left-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    策展
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-black space-y-1 leading-relaxed">
                  <p className="text-slate-500">用于匹配更适合你娃的局与场域。</p>
                </div>
              </div>
            </div>

            {orders.length > 0 && (
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col justify-between">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify之间">
              场地预约订单（Demo）
              <span className="text-[10px] text-[#108542] font-black">
                共 {orders.length} 单
              </span>
            </p>
            <div className="space-y-2">
              {orders.slice(0, 3).map(order => {
                let statusText = order.status;
                if (order.status === 'PENDING_VENUE') statusText = '待场地主确认';
                else if (order.status === 'CONFIRMED') statusText = '场地已确认合作';
                else if (order.status === 'SETTLED') statusText = '已结算';
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between text-[10px] text-slate-600 font-bold"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="truncate">{order.placeName}</p>
                      <p className="text-[9px] text-slate-400">状态：{statusText}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 uppercase">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </div>
        </div>

        {/* 我创建的局 · 局长视角 */}
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            我创建的局
          </h3>
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col justify-between">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              局长信用评级
              <span className="text-[10px] text-[#108542] font-black italic">
                {displayReliability}/100
              </span>
            </p>
            <div className="space-y-3">
              {/* 总体信用进度条 */}
              <div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ${
                      radarPulse ? 'scale-x-105 origin-left' : ''
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, displayReliability))}%` }}
                  />
                </div>
                <p className="mt-1 text-[9px] text-slate-400 font-bold">
                  分数越高，开局越轻松，押金要求越低。
                </p>
              </div>

              {/* 五个维度条形标签 */}
              {(() => {
                const ds =
                  auth.user?.directorStats ||
                  auth.userProfile.directorStats ||
                  {};
                const totalPublished = ds.total_published || 0;
                const totalCompleted = ds.total_completed || 0;
                const recapCount = ds.recap_count || 0;
                const ratingAvg = ds.rating_avg || 0;
                const venueRatingAvg = ds.venue_rating_avg || 0;
                const featured = ds.featured_recaps || 0;

                const dims = [
                  {
                    label: '履约',
                    value: totalPublished
                      ? Math.round((totalCompleted / Math.max(1, totalPublished)) * 100)
                      : 0,
                  },
                  {
                    label: '内容',
                    value: Math.min(100, recapCount * 10),
                  },
                  {
                    label: '口碑',
                    value: Math.min(
                      100,
                      (((ratingAvg + venueRatingAvg) / 10) || 0) * 100
                    ),
                  },
                  {
                    label: '活跃度',
                    value: Math.min(100, totalPublished * 5),
                  },
                  {
                    label: '精选',
                    value: Math.min(100, featured * 15),
                  },
                ];

                return (
                  <div className="space-y-1.5">
                    {dims.map(dim => (
                      <div key={dim.label} className="flex items-center gap-2">
                        <span className="w-10 text-[8px] font-black text-slate-400">
                          {dim.label}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-[#108542]"
                            style={{ width: `${Math.min(100, Math.max(0, dim.value))}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[8px] font-black text-slate-400">
                          {dim.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* 说明 & 勋章 */}
              <div className="text-[9px] text-slate-500 font-bold space-y-1 leading-relaxed">
                <p>
                  发布 {auth.userProfile.directorStats?.total_published ?? 0} 场，已完结{' '}
                  {auth.userProfile.directorStats?.total_completed ?? 0} 场，Recap{' '}
                  {auth.userProfile.directorStats?.recap_count ?? 0} 篇。
                </p>
                <p>
                  家长评分 {(auth.userProfile.directorStats?.rating_avg ?? 0).toFixed(1)} / 5，
                  场地主评分 {(auth.userProfile.directorStats?.venue_rating_avg ?? 0).toFixed(1)} / 5。
                </p>
                {(() => {
                  const stats =
                    auth.user?.directorStats ||
                    auth.userProfile.directorStats ||
                    {};
                  const score =
                    stats.reliability_score ?? calculateDirectorScore(stats);
                  const priv = getDirectorPrivileges(score);
                  const badges = [];
                  if ((auth.userProfile.directorStats?.total_completed || 0) >= 100) {
                    badges.push('百场无爽约');
                  }
                  if (
                    (auth.userProfile.directorStats?.rating_avg || 0) >= 4.8 &&
                    (auth.userProfile.directorStats?.total_completed || 0) >= 20
                  ) {
                    badges.push('明星领队');
                  }
                  return (
                    <>
                      {badges.length > 0 && (
                        <p className="text-[#108542]">
                          信用勋章：{badges.join(' · ')}
                        </p>
                      )}
                      {priv.depositFree && (
                        <p className="text-[#108542]">
                          当前权益：免押金开局（Gold 局长）。
                        </p>
                      )}
                      {priv.doubleDeposit && (
                        <p className="text-amber-600">
                          当前限制：需双倍保证金，且同期开局不超过 1 场。
                        </p>
                      )}
                      {!priv.depositFree && !priv.doubleDeposit && badges.length === 0 && (
                        <p className="text-slate-400">
                          保持良好履约与高质量内容，可解锁免押金与更多勋章。
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 我的场地 · 场地主视角 */}
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            我的场地
          </h3>
          {cooperations.length > 0 && (
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col justify-between">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                场地合作与结算（Demo）
                <span className="text-[10px] text-[#108542] font-black">
                  共 {cooperations.length} 笔
                </span>
              </p>
              <div className="space-y-2">
                {cooperations.slice(0, 3).map(coop => (
                  <div
                    key={coop.id}
                    className="flex items-center justify-between text-[10px] text-slate-600 font-bold"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="truncate">
                        {coop.placeName || '合作场地'}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        预估 ¥{Number(coop.totalAmount).toFixed(0)} · 抽佣{' '}
                        {Number(coop.commissionRate).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-[#108542] font-black">
                        平台收入 ¥{Number(coop.commissionAmount).toFixed(0)}
                      </p>
                      <p className="text-[8px] text-slate-400 uppercase">
                        {coop.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
         <button
           type="button"
           onClick={() => setShowCustomActivity(true)}
           className="w-full py-5 bg-[#108542] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-green-900/10"
         >
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

  const renderMe = () => (
    <MeTabView renderLegacy={renderMeLegacy} />
  );

  const CustomActivityForm = ({ auth, onCreate, onCancel }) => {
    const [title, setTitle] = useState('');
    const [area, setArea] = useState('');
    const [brief, setBrief] = useState('');
    const [loadingCreate, setLoadingCreate] = useState(false);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!title.trim()) return;
      const now = Date.now();
      const activity = {
        id: now,
        ownerId: auth.user?.id,
        tag: '自研局',
        category: '非常策展',
        title: title.trim(),
        host: auth.user?.nickname || auth.user?.phone || '匿名局长',
        price: 0,
        capacity: 5,
        joined: 0,
        lifecycleStatus: 'DRAFT',
        stats: [60, 60, 60, 60, 60],
        cover:
          'https://images.unsplash.com/photo-1515165562835-c4c9e0737eaa?auto=format&fit=crop&w=800&q=80',
        location: area.trim() || '城市 · 待协商',
        statusText: '自研局 · 草稿',
        matchScore: 85,
        labels: ['自研局', '家庭共创'].slice(0, 3),
        description: brief.trim(),
        venueType: 'PRIVATE',
      };
      setLoadingCreate(true);
      setTimeout(() => {
        onCreate?.(activity);
        setLoadingCreate(false);
      }, 300);
    };

    return (
      <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 flex flex-col gap-1">
          <p className="text-[10px] font-black text-amber-700">
            你正在以【局长】身份发起一场局
          </p>
          <p className="text-[9px] font-bold text-amber-700/90">
            你需要负责：时间 · 规则 · 组织（现场沟通与收尾）
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            一句话给这个局起个名字 *
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：周末徐汇滨江溜娃 + 咖啡小局"
            className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            大致地点
          </p>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="例如：徐汇滨江 / 朝阳公园 / 某亲子空间"
            className="w-full h-11 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            简单说说这个局的想法（选填）
          </p>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="想做什么、适合多大孩子、大概想几组家庭一起..."
            className="w-full rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40 resize-none"
          />
        </div>
        <div className="mt-2 text-[9px] font-bold text-slate-500">
          {(() => {
            const score = calculateDirectorScore(auth.userProfile.directorStats || {});
            if (score >= 95) {
              return '由于您的信用分已达 95 分，本次开局免收保证金（Demo 提示）。';
            }
            if (score < 70) {
              return '当前信用分较低，本次开局可能需要双倍保证金且限制同时开局数量。';
            }
            return '保持良好履约记录可逐步解锁免押金权益。';
          })()}
        </div>
        <div className="flex flex-col gap-2 mt-3">
          <button
            type="submit"
            disabled={loadingCreate || !title.trim()}
            className="w-full py-3 bg-[#108542] text-white rounded-2xl font-black text-sm active:scale-95 transition-all disabled:opacity-70"
          >
            {loadingCreate ? '创建中...' : '生成自研局草稿'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] active:scale-95 transition-all"
          >
            先不发起
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="flex h-screen bg-slate-900 max-w-md mx-auto overflow-hidden font-sans relative text-slate-800 shadow-2xl">
      <div className="absolute inset-0 bg-white w-full h-full">
        {isInitializing ? (
          <SplashScreen onComplete={() => setIsInitializing(false)} />
        ) : (
          <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* 需要登录时手动展示登录/注册弹窗 */}
            {showAuthModal && !auth.token && <AuthModal onSuccess={handleAuthSuccess} />}
            {showInspiration && (
              <div
                className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex flex-col"
                onClick={() => setShowInspiration(false)}
              >
                <div
                  className="bg-white rounded-b-3xl px-5 pt-10 pb-4 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInspiration(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <div>
                        <p className="text-sm font-black text-slate-900">灵感相册 · IDEA MOODBOARD</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                          PLATFORM-WIDE AESTHETIC INSPIRATIONS
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg黑 overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                  {inspirationImages.length === 0 ? (
                    <div className="px-5 pt-4 pb-6">
                      <p className="text-[10px] text-slate-400 font-black">
                        暂时还没有可以展示的灵感图片，去「场域」和「组局广场」多逛逛吧。
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 pt-4 pb-8">
                        {inspirationImages.map((item) => {
                          const likeCount =
                            inspirationLikes[item.id] ?? item.baseLikes ?? 0;
                          return (
                            <div
                              key={item.id}
                              className="relative w-full aspect-[9/16] max-w-md mx-auto rounded-[32px] overflow-hidden bg-slate-900"
                            >
                              <img
                                src={item.url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                {(item.moodTags || []).slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-full bg-black/50 border border-white/20 text-[8px] font-black text-white/90"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="absolute bottom-3 left-3 right-3 space-y-2">
                                <div className="flex flex-wrap gap-1.5">
                                  {(item.gearList || []).slice(0, 2).map(g => (
                                    <span
                                      key={g}
                                      className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[8px] font-black text-white/80"
                                    >
                                      {g}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleInspirationSameStyle(item)}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-900 text-[9px] font-black active:scale-95 transition-all"
                                  >
                                    <Sparkles size={11} className="text-amber-500" />
                                    一键同款 · 发个心愿
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-[9px] font-black text-white/80"
                                >
                                  <span>已有 {likeCount} 人想要同款</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="px-5 pb-4">
                        <p className="text-[9px] text-slate-400 font-black">
                          这里展示的是全平台的审美灵感，你可以用「一键同款」把它们转化为自己的心愿提案。
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {showLanguageSettings && (
              <div
                className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-stretch"
                onClick={() => setShowLanguageSettings(false)}
              >
                <div
                  className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-8 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setShowLanguageSettings(false)}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
                      aria-label="关闭语言设置"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      LANGUAGE & REGION
                    </span>
                  </div>
                  <h2 className="text-lg font-black mb-2">语言与地区</h2>
                  <p className="text-[11px] text-slate-500 font-bold mb-4">
                    目前暂不区分多语种，默认以中文界面为主，后续会根据你的常用地区自动调整推荐内容。
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        当前城市（示意）
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['北京', '上海', '广州', '深圳'].map(city => (
                          <button
                            key={city}
                            type="button"
                            className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-500"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        界面语言
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 py-2 rounded-xl bg-[#108542] text-white text-[10px] font-black border border-[#108542]"
                        >
                          简体中文（当前）
                        </button>
                        <button
                          type="button"
                          className="flex-1 py-2 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black border border-slate-200"
                        >
                          English（敬请期待）
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showAccountSettings && (
              <div
                className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-stretch"
                onClick={() => setShowAccountSettings(false)}
              >
                <div
                  className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-8 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setShowAccountSettings(false)}
                      className="w-9 h-9 rounded-full flex items中心 justify-center bg-slate-50 text-slate-500 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
                      aria-label="关闭设置"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      SETTINGS
                    </span>
                  </div>
                  <h2 className="text-lg font-black mb-2">账户与偏好设置</h2>
                  <p className="text-[11px] text-slate-500 font-bold mb-4">
                    这里未来会支持通知偏好、隐私与数据授权等设置，目前为预留入口。
                  </p>
                  <div className="space-y-3">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-left"
                    >
                      <span className="text-[11px] font-bold text-slate-700">通知与提醒</span>
                      <span className="text-[9px] font-black text-slate-400">即将上线</span>
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-left"
                    >
                      <span className="text-[11px] font-bold text-slate-700">隐私与数据使用</span>
                      <span className="text-[9px] font-black text-slate-400">即将上线</span>
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-left"
                    >
                      <span className="text-[11px] font-bold text-slate-700">帮助与反馈</span>
                      <span className="text-[9px] font-black text-slate-400">敬请期待</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showSearch && (
              <div
                className="absolute inset-0 z-40 bg-black/30 backdrop-blur-sm flex flex-col"
                onClick={() => setShowSearch(false)}
              >
                <div
                  className="bg-white rounded-b-3xl px-5 pt-10 pb-4 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSearch(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-full px-3 py-2">
                      <Search size={16} className="text-slate-400" />
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRecentSearch(searchQuery);
                          }
                        }}
                        placeholder="搜索活动 / 场地 / 局长 / 场景"
                        className="flex-1 bg-transparent outline-none text-[13px]"
                      />
                    </div>
                  </div>
                  {searchQuery.trim() === '' && (
                    <p className="mt-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      尝试搜索：徐汇滨江溜娃 / 公园野餐 / 城市自然
                    </p>
                  )}
                </div>
                <div className="flex-1 bg-slate-50/80 px-5 pt-3 pb-6 overflow-y-auto no-scrollbar space-y-4">
                  {searchQuery.trim() !== '' ? (
                    <>
                      {(searchResults.activities.length > 0 ||
                        searchResults.places.length > 0 ||
                        searchResults.people.length > 0 ||
                        searchResults.topics.length > 0) ? (
                        <>
                          {searchResults.activities.length > 0 && (
                            <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  活动
                                </p>
                                <span className="text-[10px] text-slate-300 font-black">
                                  {searchResults.activities.length} 条
                                </span>
                              </div>
                              <div className="space-y-2">
                                {searchResults.activities.map((a) => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => {
                                      addRecentSearch(searchQuery);
                                      setShowSearch(false);
                                      setActiveTab('explore');
                                      setSelectedActivity(a);
                                    }}
                                    className="w-full flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
                                  >
                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                                      <img src={a.cover} alt={a.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-black text-slate-900 truncate">
                                        {a.title}
                                      </p>
                                      <p className="text-[10px] text-slate-400 line-clamp-1">
                                        {(a.labels || []).join(' · ')}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {searchResults.places.length > 0 && (
                            <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  场地
                                </p>
                                <span className="text-[10px] text-slate-300 font-black">
                                  {searchResults.places.length} 条
                                </span>
                              </div>
                              <div className="space-y-2">
                                {searchResults.places.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      addRecentSearch(searchQuery);
                                      setShowSearch(false);
                                      setActiveTab('place');
                                      const full = places.find(pl => pl.id === p.id);
                                      if (full) {
                                        setSelectedPlace(full);
                                      }
                                    }}
                                    className="w-full flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
                                  >
                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                                      {p.cover ? (
                                        <img src={p.cover} alt={p.name} className="w-full h-full object-cover" />
                                      ) : null}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-black text-slate-900 truncate">
                                        {p.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 line-clamp-1">
                                        {p.suggestedUse}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {searchResults.people.length > 0 && (
                            <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  局长 / 家长
                                </p>
                                <span className="text-[10px] text-slate-300 font-black">
                                  {searchResults.people.length} 位
                                </span>
                              </div>
                              <div className="space-y-2">
                                {searchResults.people.map((p) => (
                                  <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => {
                                      addRecentSearch(searchQuery);
                                      setShowSearch(false);
                                      if (p.convoId) {
                                        const convo = conversations.find(c => c.id === p.convoId);
                                        if (convo) setCurrentChat(convo);
                                      } else {
                                        setActiveTab('feed');
                                      }
                                    }}
                                    className="w-full flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
                                  >
                                    <div className="w-9 h-9 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                                      <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-black text-slate-900 truncate">
                                        {p.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {p.role}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {searchResults.topics.length > 0 && (
                            <div className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  生活场景 / 主题
                                </p>
                                <span className="text-[10px] text-slate-300 font-black">
                                  {searchResults.topics.length} 个
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {searchResults.topics.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                      addRecentSearch(searchQuery);
                                      setShowSearch(false);
                                      setActiveTab('explore');
                                      setExploreFilter('全部');
                                      setExploreTopicFilter(t);
                                    }}
                                    className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-600"
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center px-6">
                          <p className="text-[13px] font-black text-slate-600 mb-1">
                            暂时没有找到相关内容
                          </p>
                          <p className="text-[11px] text-slate-400">
                            可以尝试换一个关键词，或去心愿池里发布一个新的心愿～
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          热门搜索
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['徐汇滨江溜娃', '公园野餐', '咖啡馆闲聊', '城市自然', '科学小实验'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setSearchQuery(t);
                                addRecentSearch(t);
                              }}
                              className="px-3 py-1 rounded-full bg-white border border-slate-100 text-[10px] font-black text-slate-600"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      {recentSearches.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            最近搜索
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {recentSearches.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSearchQuery(t)}
                                className="px-3 py-1 rounded-full bg-white border border-slate-100 text-[10px] font-black text-slate-600"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'explore' && renderExplore()}
            {activeTab === 'place' && renderPlace()}
            {activeTab === 'wish' && renderWish()}
            {activeTab === 'feed' && renderFeed()}
            {activeTab === 'me' && renderMe()}

            {/* 子级导航 */}
            {currentChat && (
              <ChatWindow
                key={currentChat.id}
                session={currentChat}
                onBack={() => {
                  setCurrentChat(null);
                  setActiveTab('feed');
                }}
                onRead={markConversationRead}
                onSendMessage={(sessionId, message) => {
                  setConversations(prev =>
                    prev.map(c =>
                      c.id === sessionId
                        ? {
                            ...c,
                            messages: [...(c.messages || []), message],
                            lastMsg: message.text,
                            time: message.time,
                          }
                        : c
                    )
                  );
                }}
              />
            )}
            {selectedActivity && (
              <ActivityDetail
                activity={selectedActivity}
                onBack={() => setSelectedActivity(null)}
                token={auth.token}
                currentUserId={auth.user?.id}
                userLocation={userLocation}
                onRefetchLocation={requestUserLocation}
                onCancelActivity={cancelActivity}
                onContactVenue={(detail) => {
                  const place =
                    places.find(p => detail.location && detail.location.includes(p.name)) ||
                    places.find(p => p.lat === detail.lat && p.lng === detail.lng);
                  if (place) {
                    handleContactPlaceOwner(place);
                  }
                }}
                onJoin={(act, joinMeta) => {
                  // 避免重复报名导致人数虚高：如果该活动已标记为当前用户加入，则不再处理
                  if (act.hasJoinedByMe) return;
                  // 1）更新兴趣画像等
                  bumpInterests('join', act.category);
                  // 2）同步更新活动列表中的 joined（以及相关显示字段）
                  setActivities(prev =>
                    prev.map(a => {
                      if (a.id !== act.id) return a;
                      if (a.hasJoinedByMe) return a;
                      const nextJoined = (a.joined || 0) + 1;
                      const cap = a.capacity;
                      const isFull = Number.isFinite(cap) && cap > 0 && nextJoined >= cap;
                      return {
                        ...a,
                        joined: nextJoined,
                        lifecycleStatus: isFull ? 'FULL' : a.lifecycleStatus,
                        statusText: (Number.isFinite(cap) && cap > 0)
                          ? (isFull ? `已满员 · 已报${nextJoined}组` : a.statusText)
                          : a.statusText,
                        hasJoinedByMe: true,
                      };
                    })
                  );
                  if (joinMeta?.includeInsurance) {
                    console.log('保险已勾选 · Demo', joinMeta);
                  }
                  if (joinMeta?.totalFee && joinMeta.totalFee > 0) {
                    setPaymentActivity(act);
                    setPaymentMeta(joinMeta);
                    setPaymentError('');
                  }
                }}
                onCheckInSuccess={(detail, meta) => {
                  const stats = auth.userProfile.directorStats || {};
                  // LBS 打卡成功记一次 checkin，并轻微提升信用分（Demo）
                  authDispatch({
                    type: 'UPDATE_DIRECTOR_STATS',
                    payload: {
                      ...stats,
                      checkins: (stats.checkins || 0) + 1,
                    },
                  });
                  updateDirectorScore(1);
                  console.log('LBS 打卡成功 · Demo', { detailId: detail.id, meta });
                }}
              />
            )}
            {selectedPlace && (
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-stretch"
                onClick={() => setSelectedPlace(null)}
              >
                <div
                  className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-4 overflow-y-auto relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-4 left-4 z-10">
                    <button
                      type="button"
                      onClick={() => setSelectedPlace(null)}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-900/80 text-white active:scale-90 transition-all"
                      aria-label="关闭场地详情"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  </div>
                  <div className="w-12 h-1 rounded-full bg-slate-200 mx-auto mb-4 mt-2" />
                  <div className="rounded-3xl overflow-hidden mb-4">
                    <img
                      src={selectedPlace.cover}
                      alt={selectedPlace.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <h2 className="text-lg font-black mb-1 flex items-center gap-2">
                    {selectedPlace.name}
                    {selectedPlace.isOwnerSubmitted && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase">
                        BY 场地主
                      </span>
                    )}
                  </h2>
                  {selectedPlace.vibe && (
                    <p className="text-[11px] text-slate-500 font-bold mb-2">
                      {selectedPlace.vibe}
                    </p>
                  )}
                  <div className="mt-1 mb-3 flex items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter flex items-center gap-1 min-w-0">
                      <MapPin size={10} />
                      <span className="truncate">
                        {selectedPlace.address || selectedPlace.city || selectedPlace.distance || '待补充'}
                      </span>
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-500 active:scale-95 transition-all"
                    >
                      <Navigation size={11} className="text-slate-400" />
                      <span>查看距离</span>
                    </button>
                  </div>

                  {selectedPlace.ownershipType === 'PUBLIC' && (
                    <div className="mb-4 p-3 rounded-[24px] bg-amber-50 border border-amber-100 space-y-1.5">
                      <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
                        公共场域温馨提示
                      </p>
                      <p className="text-[10px] text-amber-800 font-bold">
                        公共空间请注意：1.不要喧哗 2.带走垃圾 3.严禁明火
                      </p>
                    </div>
                  )}

                  {selectedPlace.isOwnerSubmitted && (selectedPlace.contactName || selectedPlace.availableSlots) && (
                    <div className="mb-4 p-3 rounded-[24px] bg-slate-50 border border-slate-100 space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        场地主入驻信息（Demo）
                      </p>
                      {selectedPlace.contactName && (
                        <p className="text-[10px] text-slate-600 font-bold">
                          联系人：{selectedPlace.contactName}
                        </p>
                      )}
                      {selectedPlace.contactPhone && (
                        <p className="text-[10px] text-slate-600 font-bold">
                          手机：{selectedPlace.contactPhone}
                        </p>
                      )}
                      {selectedPlace.contactWeChat && (
                        <p className="text-[10px] text-slate-600 font-bold">
                          微信：{selectedPlace.contactWeChat}
                        </p>
                      )}
                      {selectedPlace.availableSlots && (
                        <p className="text-[10px] text-slate-600 font-bold">
                          可预约时段：{selectedPlace.availableSlots}
                        </p>
                      )}
                      <p className="text-[9px] text-slate-400 font-bold">
                        以上信息来自场地主入驻表单，仅用于平台撮合合作与风控，不会对外公开（Demo）。
                      </p>
                    </div>
                  )}

                  {Array.isArray(selectedPlace.spaceTags) && selectedPlace.spaceTags.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">
                        空间标签
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPlace.spaceTags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-[9px] text-slate-400 font-black">
                      可在地图页中查看该场地的大致位置与动线规划（Demo）。
                    </p>
                  </div>

                  <div className="space-y-5">
                    {(selectedPlace.summary || selectedPlace.suggestedUse) && (
                      <section>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">
                          空间简介
                        </p>
                        <p className="text-[11px] text-slate-600 font-bold">
                          {selectedPlace.summary || selectedPlace.suggestedUse}
                        </p>
                      </section>
                    )}

                    {selectedPlace.playbook && !selectedPlace.isOwnerSubmitted && (
                      <section>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">
                          空间可塑性 · 怎么玩
                        </p>
                        <div className="space-y-3">
                          {['day', 'night', 'rain', 'season']
                            .filter(key => Array.isArray(selectedPlace.playbook?.[key]) && selectedPlace.playbook[key].length > 0)
                            .map(key => {
                              const labelMap = {
                                day: '白天怎么玩',
                                night: '晚上怎么玩',
                                rain: '雨天备选',
                                season: '季节限定',
                              };
                              return (
                                <div key={key} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                  <p className="text-[9px] font-black text-slate-500 mb-1">
                                    {labelMap[key] || key}
                                  </p>
                                  <div className="space-y-1.5">
                                    {selectedPlace.playbook[key].map((item, idx) => (
                                      <div key={idx}>
                                        <p className="text-[11px] font-bold text-slate-800">
                                          {item.title}
                                        </p>
                                        {item.summary && (
                                          <p className="text-[10px] text-slate-500">
                                            {item.summary}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </section>
                    )}

                    {Array.isArray(selectedPlace.poi) && selectedPlace.poi.length > 0 && (
                      <section>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">
                          场内关键点位
                        </p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                          {selectedPlace.poi.map(point => (
                            <div
                              key={point.name}
                              className="shrink-0 w-40 p-3 rounded-2xl bg-slate-50 border border-slate-100"
                            >
                              <p className="text-[11px] font-bold text-slate-800 mb-1">
                                {point.name}
                              </p>
                              {point.tip && (
                                <p className="text-[10px] text-slate-500">
                                  {point.tip}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {Array.isArray(selectedPlace.rules) && selectedPlace.rules.length > 0 && (
                      <section>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">
                          适配人群 & 规则边界
                        </p>
                        <ul className="space-y-1.5">
                          {selectedPlace.rules.map((rule, idx) => (
                            <li key={idx} className="text-[10px] text-slate-600 font-bold">
                              · {rule}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {(Array.isArray(selectedPlace.cases) && selectedPlace.cases.length > 0) && (
                      <section>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                            {selectedPlace.isOwnerSubmitted
                              ? '场地主上传的过往图片 / 案例'
                              : 'EXTRA 场地 · 过往局长 / 策展人案例'}
                          </p>
                        </div>
                        <div className="space-y-3">
                          {selectedPlace.cases.map((c) => (
                            <div
                              key={c.title + c.time}
                              className="p-3 rounded-2xl bg-slate-50 border border-slate-100"
                            >
                              <p className="text-[11px] font-bold text-slate-800 mb-0.5">
                                {c.title}
                              </p>
                              {c.time && (
                                <p className="text-[9px] text-slate-400 font-black mb-0.5">
                                  {c.time}
                                </p>
                              )}
                              {!selectedPlace.isOwnerSubmitted && c.curator && (
                                <p className="text-[9px] text-slate-400 font-black mb-1">
                                  过往局长 / 策展人：{c.curator}
                                </p>
                              )}
                              {c.summary && (
                                <p className="text-[10px] text-slate-600 mb-2">
                                  {c.summary}
                                </p>
                              )}
                              {Array.isArray(c.images) && c.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                  {c.images.map((url) => (
                                    <div
                                      key={url}
                                      className="w-24 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0"
                                    >
                                      <img src={url} alt="case" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {Array.isArray(selectedPlace.caseStudies) && selectedPlace.caseStudies.length > 0 && (
                      <section>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">
                          历史方案参考价格（Demo）
                        </p>
                        <div className="space-y-2">
                          {selectedPlace.caseStudies.map((cs) => (
                            <div
                              key={cs.title}
                              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-800 line-clamp-1">
                                  {cs.title}
                                </p>
                                {cs.description && (
                                  <p className="text-[9px] text-slate-500 line-clamp-2">
                                    {cs.description}
                                  </p>
                                )}
                                {cs.families && (
                                  <p className="text-[9px] text-slate-400 mt-0.5">
                                    适合：{cs.families}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-black text-slate-900">
                                  ¥{cs.price}
                                </p>
                                {cs.unit && (
                                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
                                    {cs.unit}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {Array.isArray(selectedPlace.caseImages) && selectedPlace.caseImages.length > 0 && !selectedPlace.cases && (
                      <section>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">
                          过往案例（DEMO）
                        </p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                          {selectedPlace.caseImages.map((url) => (
                            <div key={url} className="w-32 h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                              <img src={url} alt="case" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleContactPlaceOwner(selectedPlace)}
                      className="w-full py-2.5 rounded-2xl bg-[#108542]/5 text-[#108542] text-[11px] font-black flex items-center justify-center gap-2"
                    >
                      <MessageSquareHeart size={14} />
                      {selectedPlace.ownershipType === 'ENTERPRISE'
                        ? '联系平台顾问 · 确认档期与合作'
                        : '私信场地主'}
                    </button>
                    {!selectedPlace.isOwnerSubmitted && selectedPlace.allowDirectorCoop !== false && (
                      <button
                        type="button"
                        onClick={() => handleCreateActivityFromPlace(selectedPlace)}
                        className="w-full py-2.5 rounded-2xl bg-slate-900 text-white text-[11px] font-black flex items-center justify-center gap-2"
                      >
                        <Plus size={14} />
                        基于此场地草拟一场局（Demo）
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {wishToCurate && (
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-stretch"
                onClick={() => setWishToCurate(null)}
              >
                <div
                  className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-8 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setWishToCurate(null)}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
                      aria-label="关闭心愿组局面板"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                  </div>
                  <h2 className="text-lg font-black mb-2">基于心愿发起一个局</h2>
                  <p className="text-[11px] text-slate-500 font-bold mb-4">
                    你将作为局长，基于这条心愿创建一个正式的组局条目，其他家长可以报名参加。
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4 space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      心愿内容
                    </p>
                    <p className="text-[12px] font-bold text-slate-900">
                      {wishToCurate.title}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      场景：{(wishToCurate.scenes || []).join(' / ') || '未指定'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      大致区域：{wishToCurate.area || '待协商'}
                    </p>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      组局基本信息（自动生成，可稍后在后台完善）
                    </p>
                    <p className="text-[10px] text-slate-500">
                      标题：{wishToCurate.title.slice(0, 40)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      价格：FREE · 默认 0 元（可在正式发布前调整）
                    </p>
                    <p className="text-[10px] text-slate-500">
                      容量：默认 5 组家庭（可在正式发布前调整）
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        handleCreateActivityFromWish(wishToCurate);
                        setWishToCurate(null);
                      }}
                      className="w-full py-3 bg-[#108542] text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
                    >
                      确认一键领取 · 生成组局
                    </button>
                    <button
                      type="button"
                      onClick={() => setWishToCurate(null)}
                      className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] active:scale-95 transition-all"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}
            {respondWishForVenue && (
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-stretch"
                onClick={() => setRespondWishForVenue(null)}
              >
                <div
                  className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-8 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setRespondWishForVenue(null)}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
                      aria-label="关闭心愿合作面板"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                  </div>
                  <h2 className="text-lg font-black mb-2">我能提供场地 · 响应这个心愿</h2>
                  <p className="text-[11px] text-slate-500 font-bold mb-4">
                    你将以「场地方」身份响应这条心愿，平台会为你和心愿发起人创建一个合作沟通窗口，具体时间、人数和费用可以在聊天中继续确认。
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4 space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      心愿提案
                    </p>
                    <p className="text-[12px] font-bold text-slate-900">
                      {respondWishForVenue.title}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      大致区域：{respondWishForVenue.suggestedArea || respondWishForVenue.area || '待协商'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      目标募集人数：{respondWishForVenue.targetPeopleCount || 4} 组家庭
                    </p>
                  </div>
                  <div className="space-y-3 mb-5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      场地主入驻心愿单（Demo）
                    </p>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          你大致能接待多少组家庭？
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['1-2 组家庭', '3-5 组家庭', '5-8 组家庭', '8 组以上'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setVenueRespondFamilies(opt)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                                venueRespondFamilies === opt
                                  ? 'bg-[#108542] text-white border-[#108542]'
                                  : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          你比较方便的时段是？
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['周末白天', '工作日晚上', '节假日', '需单独协商'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setVenueRespondTime(opt)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                                venueRespondTime === opt
                                  ? 'bg-[#108542] text-white border-[#108542]'
                                  : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          你想补充的备注（选填）
                        </p>
                        <textarea
                          value={venueRespondNotes}
                          onChange={e => setVenueRespondNotes(e.target.value)}
                          rows={3}
                          placeholder="例如：是否可封场、预估价位区间、是否含基础物料等。"
                          className="w-full rounded-2xl bg-white px-3 py-2 text-[11px] font-bold outline-none border border-slate-200 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (!auth.token) {
                          setShowAuthModal(true);
                          return;
                        }
                        const wish = respondWishForVenue;
                        const convId = `wish-venue-${wish.id}`;
                        const existing = conversations.find(c => c.id === convId);
                        const summaryParts = [];
                        if (venueRespondFamilies) summaryParts.push(`可接待：${venueRespondFamilies}`);
                        if (venueRespondTime) summaryParts.push(`方便时段：${venueRespondTime}`);
                        const detailText = summaryParts.join('；');
                        const notesText = venueRespondNotes ? `\n补充说明：${venueRespondNotes}` : '';
                        if (existing) {
                          const firstMessage = createSystemMessage(
                            '场地方响应心愿',
                            `你正在以「场地方」身份响应心愿「${wish.title}」。\n\n场地主入驻心愿单信息：${detailText || '待双方在群内补充'}${notesText}`
                          );
                          const updated = {
                            ...existing,
                            messages: [...(existing.messages || []), firstMessage],
                            lastMsg: firstMessage.text,
                            time: firstMessage.time,
                          };
                          setConversations(prev => prev.map(c => (c.id === convId ? updated : c)));
                          setCurrentChat(updated);
                        } else {
                          const firstMessage = createSystemMessage(
                            '场地方响应心愿',
                            `你正在以「场地方」身份响应心愿「${wish.title}」。\n\n场地主入驻心愿单信息：${detailText || '待双方在群内补充'}${notesText}`
                          );
                          const newConv = {
                            id: convId,
                            name: `心愿撮合 · ${wish.area || wish.suggestedArea || '待定区域'}`,
                            lastMsg: firstMessage.text,
                            time: '刚刚',
                            unread: 0,
                            type: 'group',
                            isGroup: true,
                            messages: [firstMessage],
                            fromWishId: wish.id,
                            isPlaceConversation: true,
                          };
                          setConversations(prev => [newConv, ...prev]);
                          setCurrentChat(newConv);
                        }
                // 心愿侧记录有场地方响应
                setWishes(prev =>
                  prev.map(w =>
                    w.id === wish.id
                      ? {
                          ...w,
                          status: w.status === 'OPEN' ? 'VENUE_RESPONDED' : w.status,
                          hasVenueResponse: true,
                        }
                      : w
                  )
                );
                        setVenueRespondFamilies('3-5 组家庭');
                        setVenueRespondTime('周末白天');
                        setVenueRespondNotes('');
                        setRespondWishForVenue(null);
                        setActiveTab('feed');
                      }}
                      className="w-full py-3 bg-[#108542] text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
                    >
                      进入合作沟通 · 创建心愿撮合群
                    </button>
                    <button
                      type="button"
                      onClick={() => setRespondWishForVenue(null)}
                      className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] active:scale-95 transition-all"
                    >
                      先不响应
                    </button>
                  </div>
                </div>
              </div>
            )}

            {paymentActivity && paymentMeta && (
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-stretch"
                onClick={() => {
                  setPaymentActivity(null);
                  setPaymentMeta(null);
                  setPaymentError('');
                }}
              >
                <div
                  className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-8 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentActivity(null);
                        setPaymentMeta(null);
                        setPaymentError('');
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
                      aria-label="关闭支付窗口"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                  </div>
                  <h2 className="text-lg font-black mb-2">支付活动费用（Demo）</h2>
                  <p className="text-[11px] text-slate-500 font-bold mb-4">
                    你已报名参加「{paymentActivity.title}」，当前为模拟支付流程，不会产生真实扣款。
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4 space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      订单摘要
                    </p>
                    <p className="text-[12px] font-black text-slate-900">
                      活动费用合计 ¥{Number(paymentMeta.totalFee).toFixed(0)}
                    </p>
                    {paymentMeta.insuranceFee > 0 && (
                      <p className="text-[10px] text-slate-500">
                        含基础活动费 ¥{Number(paymentMeta.totalFee - paymentMeta.insuranceFee).toFixed(0)} +
                        保险代购 ¥{Number(paymentMeta.insuranceFee).toFixed(0)}
                      </p>
                    )}
                  </div>
                  {paymentError && (
                    <p className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-2 mb-3">
                      {paymentError}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // 模拟支付成功：发送一条系统通知
                        const msg = createSystemMessage(
                          '活动支付成功',
                          `你已完成活动「${paymentActivity.title}」的模拟支付，支付金额 ¥${Number(
                            paymentMeta.totalFee
                          ).toFixed(0)}（Demo）。`
                        );
                        setConversations(prev => {
                          const existing = prev.find(c => c.id === 'sys-pay');
                          if (existing) {
                            const updated = {
                              ...existing,
                              messages: [...(existing.messages || []), msg],
                              lastMsg: msg.text,
                              time: msg.time,
                              unread: (existing.unread || 0) + 1,
                            };
                            return prev.map(c => (c.id === 'sys-pay' ? updated : c));
                          }
                          const conv = {
                            id: 'sys-pay',
                            name: '支付通知 · Demo',
                            lastMsg: msg.text,
                            time: msg.time,
                            unread: 1,
                            type: 'system',
                            messages: [msg],
                          };
                          return [conv, ...prev];
                        });
                        setPaymentActivity(null);
                        setPaymentMeta(null);
                        setPaymentError('');
                      }}
                      className="w-full py-3 bg-[#108542] text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
                    >
                      模拟支付成功
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = createSystemMessage(
                          '待支付提醒',
                          `你已报名活动「${paymentActivity.title}」，待支付金额 ¥${Number(
                            paymentMeta.totalFee
                          ).toFixed(0)}。可在正式接入支付后完成付款（Demo）。`
                        );
                        setConversations(prev => {
                          const existing = prev.find(c => c.id === 'sys-pay');
                          if (existing) {
                            const updated = {
                              ...existing,
                              messages: [...(existing.messages || []), msg],
                              lastMsg: msg.text,
                              time: msg.time,
                              unread: (existing.unread || 0) + 1,
                            };
                            return prev.map(c => (c.id === 'sys-pay' ? updated : c));
                          }
                          const conv = {
                            id: 'sys-pay',
                            name: '支付通知 · Demo',
                            lastMsg: msg.text,
                            time: msg.time,
                            unread: 1,
                            type: 'system',
                            messages: [msg],
                          };
                          return [conv, ...prev];
                        });
                        setPaymentActivity(null);
                        setPaymentMeta(null);
                        setPaymentError('');
                      }}
                      className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] active:scale-95 transition-all"
                    >
                      稍后再付
                    </button>
                  </div>
                </div>
              </div>
            )}

            {depositActivity && (
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[85] flex items-stretch"
                onClick={() => {
                  setDepositActivity(null);
                  setDepositAmount(0);
                  setDepositError('');
                }}
              >
                <div
                  className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-8 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setDepositActivity(null);
                        setDepositAmount(0);
                        setDepositError('');
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
                      aria-label="关闭保证金窗口"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                  </div>
                  <h2 className="text-lg font-black mb-2">支付活动保证金（Demo）</h2>
                  <p className="text-[11px] text-slate-500 font-bold mb-3">
                    根据你的局长信用分，本次发起活动需要冻结一笔保证金。当前为纯前端模拟，不会产生真实扣款。
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4 space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      保证金摘要
                    </p>
                    <p className="text-[12px] font-black text-slate-900">
                      需冻结保证金 ¥{Number(depositAmount).toFixed(0)}
                    </p>
                    {depositActivity.depositMultiplier === 2 && (
                      <p className="text-[10px] text-amber-600">
                        当前为双倍保证金（信用分较低时的风控策略 · Demo）。
                      </p>
                    )}
                    {depositActivity.depositStatus === 'UNPAID' && (
                      <p className="text-[10px] text-slate-500">
                        实际接入支付后，可以改为真实银行卡预授权或微信/支付宝小程序支付。
                      </p>
                    )}
                  </div>
                  {depositError && (
                    <p className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-2 mb-3">
                      {depositError}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = createSystemMessage(
                          '保证金支付成功',
                          `你已为活动「${depositActivity.title || depositActivity.tag || '新建活动'}」完成保证金冻结，金额 ¥${Number(
                            depositAmount
                          ).toFixed(0)}（Demo）。`
                        );
                        setConversations(prev => {
                          const existing = prev.find(c => c.id === 'sys-deposit');
                          if (existing) {
                            const updated = {
                              ...existing,
                              messages: [...(existing.messages || []), msg],
                              lastMsg: msg.text,
                              time: msg.time,
                              unread: (existing.unread || 0) + 1,
                            };
                            return prev.map(c => (c.id === 'sys-deposit' ? updated : c));
                          }
                          const conv = {
                            id: 'sys-deposit',
                            name: '保证金通知 · Demo',
                            lastMsg: msg.text,
                            time: msg.time,
                            unread: 1,
                            type: 'system',
                            messages: [msg],
                          };
                          return [conv, ...prev];
                        });
                        // 标记该活动的保证金已支付
                        setActivities(prev =>
                          prev.map(a =>
                            a.id === depositActivity.id
                              ? { ...a, depositStatus: 'PAID' }
                              : a
                          )
                        );
                        setDepositActivity(null);
                        setDepositAmount(0);
                        setDepositError('');
                      }}
                      className="w-full py-3 bg-[#108542] text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
                    >
                      模拟支付保证金
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = createSystemMessage(
                          '待支付保证金提醒',
                          `你发起的活动「${depositActivity.title || depositActivity.tag || '新建活动'}」仍有保证金待冻结，金额 ¥${Number(
                            depositAmount
                          ).toFixed(0)}。正式接入支付后，需完成该笔保证金支付才能正式开局（Demo）。`
                        );
                        setConversations(prev => {
                          const existing = prev.find(c => c.id === 'sys-deposit');
                          if (existing) {
                            const updated = {
                              ...existing,
                              messages: [...(existing.messages || []), msg],
                              lastMsg: msg.text,
                              time: msg.time,
                              unread: (existing.unread || 0) + 1,
                            };
                            return prev.map(c => (c.id === 'sys-deposit' ? updated : c));
                          }
                          const conv = {
                            id: 'sys-deposit',
                            name: '保证金通知 · Demo',
                            lastMsg: msg.text,
                            time: msg.time,
                            unread: 1,
                            type: 'system',
                            messages: [msg],
                          };
                          return [conv, ...prev];
                        });
                        setDepositActivity(null);
                        setDepositAmount(0);
                        setDepositError('');
                      }}
                      className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] active:scale-95 transition-all"
                    >
                      稍后再付
                    </button>
                  </div>
                </div>
              </div>
            )}

            {cooperationSession && (
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-stretch"
                onClick={() => {
                  setCooperationSession(null);
                  setCooperationError('');
                }}
              >
                <div
                  className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-8 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setCooperationSession(null);
                        setCooperationError('');
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
                      aria-label="关闭合作标记面板"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                  </div>
                  <h2 className="text-lg font-black mb-2">标记与场地合作 · 预估结算</h2>
                  <p className="text-[11px] text-slate-500 font-bold mb-4">
                    将本次合作的大致金额和平台抽佣比例记录下来，后续可以据此对账（Demo，本地记录，不会真实扣款）。
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4 space-y-1.5">
                    <p className="text-[9px] font黑 text-slate-400 uppercase tracking-widest">
                      合作场地
                    </p>
                    <p className="text-[12px] font-black text-slate-900">
                      {cooperationSession?.name || '场地会话'}
                    </p>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        预估成交金额（¥）
                      </p>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={cooperationAmount}
                        onChange={(e) => setCooperationAmount(e.target.value)}
                        placeholder="例如：3000"
                        className="w-full h-10 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        平台抽佣比例（%）
                      </p>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="100"
                        value={cooperationRate}
                        onChange={(e) => setCooperationRate(e.target.value)}
                        placeholder="例如：10"
                        className="w-full h-10 rounded-2xl bg-slate-50 px-3 text-xs font-bold outline-none border border-slate-100 focus:border-[#108542] focus:ring-1 focus:ring-[#108542]/40"
                      />
                    </div>
                  </div>
                  {cooperationError && (
                    <p className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-2 mb-3">
                      {cooperationError}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      type="button"
                      onClick={confirmCooperation}
                      className="w-full py-3 bg-[#108542] text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
                    >
                      确认标记合作并记录结算
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCooperationSession(null);
                        setCooperationError('');
                      }}
                      className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] active:scale-95 transition-all"
                    >
                      先不记录
                    </button>
                  </div>
                </div>
              </div>
            )}

            {applyPlace && (
              <ApplyCollaborationModal
                place={applyPlace}
                onClose={() => setApplyPlace(null)}
                onConfirm={(place, payload) => {
                  setApplyPlace(null);
                  createPlaceConversation(place, payload);

                  // 将该场地标记为「已提交合作申请」，用于跨组件实时反馈
                  setPlaces(prev =>
                    prev.map(p =>
                      p.id === place.id
                        ? { ...p, hasApplied: true }
                        : p
                    )
                  );
                  setSelectedPlace(prev =>
                    prev && prev.id === place.id ? { ...prev, hasApplied: true } : prev
                  );
                  
                  // 创建一个场地合作订单（Venue Order），等待场地主确认（Demo）
                  const order = {
                    id: `order-${Date.now()}`,
                    placeId: place.id,
                    placeName: place.name,
                    directorId: auth.user?.id,
                    status: 'PENDING_VENUE',
                    payload,
                    createdAt: new Date().toISOString(),
                  };
                  setOrders(prev => [order, ...prev]);

                  window.alert('已提交预约意向金订单，状态：等待场地主确认（Demo）。场地主确认后，该局才会在广场正式发布。');
                }}
              />
            )}
            {showCustomActivity && (
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-stretch"
                onClick={() => setShowCustomActivity(false)}
              >
                <div
                  className="w-full h-full bg-white rounded-none md:rounded-t-[32px] p-6 pb-8 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setShowCustomActivity(false)}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100 active:scale-90 active:bg-slate-100 transition-all"
                      aria-label="关闭自研局面板"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      CREATE CUSTOM ACTIVITY
                    </span>
                  </div>
                  <h2 className="text-lg font-black mb-2">发起我的自研局（简版）</h2>
                  <p className="text-[11px] text-slate-500 font-bold mb-4">
                    这是一个轻量的发起入口，方便你先把想法存下来，后续可以由平台或你自己补充完善细节。
                  </p>
                  {/* 这里先放一个最小可用表单，后续可接后台 */}
                  {/* 为了不引入过多新状态，直接复用一个本地对象 */}
                  <CustomActivityForm
                    auth={auth}
                    onCreate={(activity) => {
                      handleCreateActivity(activity);
                      setShowCustomActivity(false);
                    }}
                    onCancel={() => setShowCustomActivity(false)}
                  />
                </div>
              </div>
            )}
            {auth.token && showChildProfile && (
              <ChildProfileModal
                initial={auth.childProfile}
                onSave={(profile) => {
                  authDispatch({ type: 'SET_CHILD_PROFILE', payload: profile });
                  if (auth.user?.id) {
                    localStorage.setItem(`extra_child_profile_${auth.user.id}`, JSON.stringify(profile));
                  }
                  setShowChildProfile(false);
                }}
              />
            )}
            {showWishRecapDialog && wishToRecap && (
              <div
                className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center"
                onClick={() => {
                  setShowWishRecapDialog(false);
                  setWishToRecap(null);
                  setWishRecapImage('');
                }}
              >
                <div
                  className="w-full md:max-w-sm bg-white rounded-t-3xl md:rounded-3xl p-6 pb-7 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-sm font-black mb-2">点亮心愿（Demo）</h3>
                  <p className="text-[11px] text-slate-500 font-bold mb-3">
                    你们已经抵达心愿约定地点附近，是否要点亮这条心愿并上传一张合照作为「心愿 Recap」？
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-3 space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      心愿
                    </p>
                    <p className="text-[12px] font-bold text-slate-900 line-clamp-2">
                      {wishToRecap.title}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      大致区域：{wishToRecap.area || '待协商'}
                    </p>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      上传一张合照（代替 uni.chooseImage）
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-[10px] text-slate-500 file:text-[10px] file:font-black file:px-3 file:py-1.5 file:rounded-xl file:border file:border-slate-200 file:bg-slate-50 file:text-slate-600"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setWishRecapImage('');
                          return;
                        }
                        const url = URL.createObjectURL(file);
                        setWishRecapImage(url);
                      }}
                    />
                    {wishRecapImage && (
                      <div className="mt-2 h-32 rounded-2xl overflow-hidden border border-slate-100">
                        <img src={wishRecapImage} alt="recap-preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={!wishRecapImage}
                      className="w-full py-3 bg-[#108542] text-white rounded-2xl font-black text-sm active:scale-95 transition-all disabled:opacity-60"
                      onClick={() => {
                        const target = wishToRecap;
                        const place = places.find(p => p.id === target.appointmentPlaceId);
                        const messageText = `心愿「${target.title}」已在${
                          place ? `「${place.name}」` : '约定地点'
                        }被点亮，并上传了一张合照（WISH_RECAP · Demo）。`;
                        const recapId = `wish-recap-${target.id}-${Date.now()}`;
                        const recapConv = {
                          id: recapId,
                          name: '心愿点亮 · WISH_RECAP',
                          lastMsg: messageText,
                          time: '刚刚',
                          unread: 1,
                          type: 'system',
                          wishId: target.id,
                          recapImage: wishRecapImage,
                        };
                        setConversations(prev => [recapConv, ...prev]);
                        setWishes(prev =>
                          prev.map(w =>
                            w.id === target.id
                              ? { ...w, status: 'COMPLETED', hasRecap: true }
                              : w
                          )
                        );
                        setShowWishRecapDialog(false);
                        setWishToRecap(null);
                        setWishRecapImage('');
                      }}
                    >
                      点亮心愿 · 生成 WISH_RECAP
                    </button>
                    <button
                      type="button"
                      className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] active:scale-95 transition-all"
                      onClick={() => {
                        setShowWishRecapDialog(false);
                        setWishToRecap(null);
                        setWishRecapImage('');
                      }}
                    >
                      暂时跳过
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showSafetyModal && pendingActivity && (
              <div
                className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center"
                onClick={() => {
                  setShowSafetyModal(false);
                  setPendingActivity(null);
                }}
              >
                <div
                  className="w-full md:max-w-sm bg-white rounded-t-3xl md:rounded-3xl p-6 pb-7 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black">安全协议与保险确认</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold mb-3">
                    该活动属于户外 / 宠物相关场景。为保障所有家庭的安全，请先勾选以下内容并选择保险方案后再正式创建本局（Demo）。
                  </p>
                  <div className="space-y-2 mb-3 text-[11px] text-slate-600 font-bold">
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        onChange={(e) => {
                          setPendingActivity(prev => prev ? { ...prev, _agreedSafety: e.target.checked } : prev);
                        }}
                      />
                      <span>
                        我已阅读并同意《EXTRA 户外安全协议》（示意），会提前向参与家庭说明活动边界与注意事项。
                      </span>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        onChange={(e) => {
                          setPendingActivity(prev => prev ? { ...prev, _confirmedInsurance: e.target.checked } : prev);
                        }}
                      />
                      <span>
                        我了解本活动建议为每个家庭购买基础意外保险（Demo），并会在实际执行时与家长确认。
                      </span>
                    </label>
                  </div>
                  <div className="mb-4 text-[11px] text-slate-600 font-bold space-y-1">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      选择本次活动的保险方案（Demo）
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="insurancePlan"
                          className="mt-0.5"
                          onChange={() => {
                            setPendingActivity(prev => prev ? { ...prev, _insurancePlan: 'PLATFORM' } : prev);
                          }}
                        />
                        <span>由平台后续统一代购基础意外保险（推荐 · Demo）</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="insurancePlan"
                          className="mt-0.5"
                          onChange={() => {
                            setPendingActivity(prev => prev ? { ...prev, _insurancePlan: 'SELF' } : prev);
                          }}
                        />
                        <span>我将通过其他渠道自行为参与家庭购买保险，并在实际执行前完成（Demo）</span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={
                      !pendingActivity._agreedSafety ||
                      !pendingActivity._confirmedInsurance ||
                      !pendingActivity._insurancePlan
                    }
                    className="w-full py-3 bg-[#108542] text-white rounded-2xl font-black text-sm active:scale-95 transition-all disabled:opacity-60"
                    onClick={() => {
                      const nowIso = new Date().toISOString();
                      const enriched = {
                        ...pendingActivity,
                        requiresInsurance: true,
                        insurancePlan: pendingActivity._insurancePlan,
                        insuranceStatus:
                          pendingActivity._insurancePlan === 'PLATFORM'
                            ? 'PENDING_PAYMENT'
                            : 'AWAITING_PROOF',
                        safetyAgreementAcceptedAt: nowIso,
                        safetyAgreementVersion: 'v1-demo',
                      };

                      // 记录一条「电子协议已签署」的系统消息（Demo）
                      const msg = createSystemMessage(
                        '户外安全与保险确认',
                        `你已在 ${new Date().toLocaleString()} 发起户外/宠物主题活动「${
                          enriched.title || '新建户外局'
                        }」时，同意《EXTRA 户外安全协议》（示意），并承诺为参与家庭提供基础意外保险（方案：${
                          enriched.insurancePlan === 'PLATFORM' ? '平台后续代购' : '自行购买'
                        } · Demo）。`
                      );
                      setConversations(prev => {
                        const existing = prev.find(c => c.id === 'sys-safety');
                        if (existing) {
                          const updated = {
                            ...existing,
                            messages: [...(existing.messages || []), msg],
                            lastMsg: msg.text,
                            time: msg.time,
                            unread: (existing.unread || 0) + 1,
                          };
                          return prev.map(c => (c.id === 'sys-safety' ? updated : c));
                        }
                        const conv = {
                          id: 'sys-safety',
                          name: '安全与保险记录 · Demo',
                          lastMsg: msg.text,
                          time: msg.time,
                          unread: 1,
                          type: 'system',
                          messages: [msg],
                        };
                        return [conv, ...prev];
                      });

                      const ok = createActivityWithPrivileges(enriched);
                      if (ok) {
                        setPendingActivity(null);
                        setShowSafetyModal(false);
                      }
                    }}
                  >
                    我已确认安全与保险 · 创建这个局（Demo）
                  </button>
                </div>
              </div>
            )}
            
            {false && (
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end animate-in fade-in duration-200"
                onClick={closeWishSheet}
              >
                <div
                  className="w-full bg-white rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6"></div>
                  <h2 className="text-xl font-black mb-1 italic">EXTRA WISH</h2>
                  <p className="text-[#108542] text-[8px] font-black mb-6 tracking-widest uppercase italic tracking-tighter underline">
                    用一句话，说说你最近想和谁去哪儿遛娃
                  </p>

                  <form className="space-y-4" onSubmit={handleWishSubmit}>
                    {/* 心愿池灵感区块（整合进心愿池模块内部） */}
                    {wishes.length > 0 && (
                      <div className="space-y-2 mb-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            来自心愿池的灵感
                          </p>
                          <span className="text-[9px] text-slate-300 font-black">
                            {wishes.length} 条
                          </span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar">
                          {wishes.slice(0, 3).map(w => (
                            <div
                              key={w.id}
                              className="shrink-0 w-60 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between gap-2"
                            >
                              <p className="text-[11px] font-bold text-slate-800 line-clamp-2">
                                {w.title}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {[...(w.scenes || []), ...(w.vibes || []), w.area]
                                  .filter(Boolean)
                                  .slice(0, 3)
                                  .map(tag => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 rounded-full bg-white text-[8px] font-black text-slate-400 border border-slate-100"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <button
                                  type="button"
                                  onClick={() => handleWishLike(w.id)}
                                  className="text-[9px] font-black text-slate-400"
                                >
                                  我也想 · {w.likeCount || 0}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCreateActivityFromWish(w)}
                                  className="text-[9px] font-black text-[#108542]"
                                >
                                  基于此发起组局
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 一句话心愿 */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div className="text-slate-400 mt-1">
                          <Target size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          一句话心愿 *
                          </p>
                          <input
                          value={wishForm.title}
                            onChange={e =>
                            setWishForm(prev => ({ ...prev, title: e.target.value }))
                            }
                          placeholder="例如：周六想去徐汇滨江溜娃+喝咖啡，有人一起吗？"
                            className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                          />
                        </div>
                      </div>

                    {/* 场景 & 氛围标签 */}
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          大致场景（可多选）
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {WISH_SCENE_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setWishForm(prev => ({
                                  ...prev,
                                  scenes: prev.scenes.includes(opt)
                                    ? prev.scenes.filter(v => v !== opt)
                                    : [...prev.scenes, opt],
                                }))
                              }
                              className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                                wishForm.scenes.includes(opt)
                                  ? 'bg-[#108542] text-white border-[#108542]'
                                  : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          氛围偏好（可多选）
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {WISH_VIBE_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setWishForm(prev => ({
                                  ...prev,
                                  vibes: prev.vibes.includes(opt)
                                    ? prev.vibes.filter(v => v !== opt)
                                    : [...prev.vibes, opt],
                                }))
                              }
                              className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                               wishForm.vibes.includes(opt)
                                  ? 'bg-[#108542] text-white border-[#108542]'
                                  : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 时间 & 区域 */}
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          什么时候方便
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {WISH_TIME_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setWishForm(prev => ({
                                  ...prev,
                                  timePrefs: prev.timePrefs.includes(opt)
                                    ? prev.timePrefs.filter(v => v !== opt)
                                    : [...prev.timePrefs, opt],
                                }))
                              }
                              className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                                wishForm.timePrefs.includes(opt)
                                  ? 'bg-[#108542] text-white border-[#108542]'
                                  : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div className="text-slate-400 mt-1">
                          <MapPin size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            大致区域（可选填）
                          </p>
                          <input
                            value={wishForm.area}
                            onChange={e =>
                              setWishForm(prev => ({ ...prev, area: e.target.value }))
                            }
                            placeholder="例如：徐汇滨江 / 朝阳公园 / 线上"
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

            {showPlaceOnboard && (
              <PlaceOnboardModal
                onClose={() => {
                  setShowPlaceOnboard(false);
                  setWishForPlaceOnboard(null);
                }}
                onSubmit={(data) => {
                  const newId = Date.now();
                  const fallbackCover =
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
                  const rawPhotoUrls = (data.photoUrls || '')
                    .split(/\n|,|;/)
                    .map((t) => t.trim())
                    .filter(Boolean);
                  const allPhotoUrls = [
                    ...(Array.isArray(data.uploadedPhotoUrls) ? data.uploadedPhotoUrls : []),
                    ...rawPhotoUrls,
                  ];
                  const caseImages = allPhotoUrls.length ? allPhotoUrls : undefined;
                  const coverFromPhotos = allPhotoUrls[0];
                  const suggestedUseText =
                    data.description ||
                    (data.useTags && data.useTags.length
                      ? `适合：${data.useTags.join(' / ')}`
                      : '适合小而精的亲子局，具体可与场地主沟通。');
                  const ownerName = data.name || '场地主';
                  const ownerCases =
                    rawPhotoUrls.length > 0
                      ? [
                          {
                            title: '场地主上传的过往照片',
                            time: '时间待补充',
                            curator: `${ownerName}`,
                            summary:
                              data.description ||
                              '场地主暂未补充详细文字说明，但已上传参考图片。',
                            images: rawPhotoUrls,
                          },
                        ]
                      : undefined;
                  let createdPlace = null;
                  setPlaces(prev => {
                    const next = [
                      {
                        id: newId,
                        name: data.name || '未命名场地',
                        category: data.features?.includes('花园') || data.features?.includes('露台')
                          ? '自然户外'
                          : '城市空间',
                        rating: 4.8,
                        distance: '· 由场地主提供',
                        address: data.city || '待补充',
                        match: 90,
                        cover: coverFromPhotos || fallbackCover,
                        isOwnerSubmitted: true,
                        suggestedUse: suggestedUseText,
                        caseImages,
                        cases: ownerCases,
                        contactName: data.contactName || '场地主',
                        contactPhone: data.contactPhone || '',
                        contactWeChat: data.contactWeChat || '',
                        availableSlots: data.availableSlots || '',
                      },
                      ...prev,
                    ];
                    createdPlace = next[0];
                    return next;
                  });

                  // 如果是从某条高热度心愿点击“我能提供场地”进来的，入驻后立即基于该心愿创建一个 Demo 活动
                  if (wishForPlaceOnboard && createdPlace) {
                    handleCreateActivity({
                      source: 'wish_proposal',
                      wish: wishForPlaceOnboard,
                      place: createdPlace,
                    });
                    setWishForPlaceOnboard(null);
                  }
                }}
              />
            )}

            {/* 全局底部导航栏 */}
            <nav className="absolute bottom-0 left-0 w-full h-24 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-6 pb-6 z-40">
              <NavItem active={activeTab === 'explore'} onClick={() => handleTabChange('explore')} icon={<Compass size={22} />} label="组局" />
              <NavItem active={activeTab === 'place'} onClick={() => handleTabChange('place')} icon={<MapPin size={22} />} label="场域" />
              <NavItem active={activeTab === 'wish'} onClick={() => handleTabChange('wish')} icon={<Sparkles size={22} />} label="心愿池" />
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