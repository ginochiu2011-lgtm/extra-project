import React, { createContext, useContext, useReducer, useEffect } from 'react';

const baseUserProfile = {
  name: '王大星',
  epScore: 840,
  level: 4,
  stats: [70, 45, 90, 60, 80],
  invites: 12,
  directorStats: {
    total_published: 8,
    total_completed: 6,
    recap_count: 4,
    rating_avg: 4.7,
    venue_rating_avg: 4.6,
    featured_recaps: 2,
    reliability_score: 88,
    checkins: 0,
  },
};

const AuthStateContext = createContext(null);
const AuthDispatchContext = createContext(null);

const initAuthState = () => {
  let token = null;
  let user = null;
  let userProfile = baseUserProfile;
  let childProfile = null;

  try {
    const storedToken = localStorage.getItem('extra_token');
    const userRaw = localStorage.getItem('extra_current_user');
    if (storedToken && userRaw) {
      const parsedUser = JSON.parse(userRaw);
      const directorStats =
        parsedUser.directorStats || baseUserProfile.directorStats;
      token = storedToken;
      user = {
        ...parsedUser,
        directorStats,
      };
      userProfile = {
        ...baseUserProfile,
        name: parsedUser.nickname || parsedUser.phone || baseUserProfile.name,
        epScore: parsedUser.ep_score || baseUserProfile.epScore,
        level: parsedUser.level || baseUserProfile.level,
        directorStats: {
          ...baseUserProfile.directorStats,
          ...directorStats,
        },
      };
      const childRaw = localStorage.getItem(`extra_child_profile_${parsedUser.id}`);
      if (childRaw) {
        try {
          const parsedChild = JSON.parse(childRaw);
          childProfile = parsedChild;
          if (Array.isArray(parsedChild.stats) && parsedChild.stats.length === 5) {
            userProfile = {
              ...userProfile,
              stats: parsedChild.stats,
            };
          }
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    token,
    user,
    userProfile,
    childProfile,
  };
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS': {
      const { token, user } = action.payload;
      return {
        ...state,
        token,
        user: {
          ...user,
          directorStats: {
            ...(user.directorStats || state.userProfile.directorStats || baseUserProfile.directorStats),
          },
        },
        userProfile: {
          ...state.userProfile,
          name: user.nickname || user.phone || state.userProfile.name,
          epScore: user.ep_score || state.userProfile.epScore,
          level: user.level || state.userProfile.level,
          directorStats: {
            ...state.userProfile.directorStats,
            ...(user.directorStats || {}),
          },
        },
      };
    }
    case 'LOGOUT': {
      return {
        token: null,
        user: null,
        userProfile: baseUserProfile,
        childProfile: null,
      };
    }
    case 'SET_CHILD_PROFILE': {
      const profile = action.payload;
      return {
        ...state,
        childProfile: profile,
        userProfile:
          Array.isArray(profile.stats) && profile.stats.length === 5
            ? { ...state.userProfile, stats: profile.stats }
            : state.userProfile,
      };
    }
    case 'UPDATE_DIRECTOR_STATS': {
      const patch = action.payload || {};
      return {
        ...state,
        user: state.user
          ? {
              ...state.user,
              directorStats: {
                ...(state.user.directorStats || state.userProfile.directorStats || baseUserProfile.directorStats),
                ...patch,
              },
            }
          : state.user,
        userProfile: {
          ...state.userProfile,
          directorStats: {
            ...state.userProfile.directorStats,
            ...patch,
          },
        },
      };
    }
    case 'SET_USER_PROFILE_STATS': {
      const stats = action.payload;
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          stats,
        },
      };
    }
    case 'BUMP_INTERESTS': {
      const { idx, delta, isJoin } = action.payload;
      const nextStats = [...state.userProfile.stats];
      nextStats[idx] = Math.min(100, nextStats[idx] + delta);

      const byKey = ['art', 'nature', 'science', 'sport', 'curation'];
      const key = byKey[idx];

      const nextUser = state.user
        ? {
            ...state.user,
            interests: {
              ...(state.user.interests || {}),
              [key]: (state.user.interests?.[key] || 0) + delta,
            },
            ep_score: (state.user.ep_score || 800) + (isJoin ? 5 : 1),
          }
        : state.user;

      return {
        ...state,
        user: nextUser,
        userProfile: {
          ...state.userProfile,
          stats: nextStats,
          epScore: state.userProfile.epScore + (isJoin ? 5 : 1),
        },
      };
    }
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, undefined, initAuthState);

  // 持久化当前用户（包含最新的 directorStats 等），避免刷新后信用分丢失
  useEffect(() => {
    try {
      if (state.user) {
        localStorage.setItem('extra_current_user', JSON.stringify(state.user));
      }
    } catch {
      // ignore
    }
  }, [state.user]);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
};

export const useAuthState = () => {
  const ctx = useContext(AuthStateContext);
  if (!ctx) throw new Error('useAuthState must be used within AuthProvider');
  return ctx;
};

export const useAuthDispatch = () => {
  const ctx = useContext(AuthDispatchContext);
  if (!ctx) throw new Error('useAuthDispatch must be used within AuthProvider');
  return ctx;
};

