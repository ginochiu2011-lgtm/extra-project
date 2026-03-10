export const calculateDirectorScore = (stats) => {
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

  const completionRate =
    total_completed > 0 ? total_completed / total_published : 0;
  const recapPerCompleted =
    total_completed > 0 ? Math.min(1, recap_count / total_completed) : 0;
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

export const getDirectorPrivileges = (score) => {
  if (score >= 90) {
    return { depositFree: true, badge: 'Gold' };
  }
  if (score < 70) {
    return { doubleDeposit: true, limitActive: 1 };
  }
  return {};
};

export const applyActivityCreationPolicy = ({
  activity,
  directorStats,
  ownerId,
  existingActivities,
  baseDeposit = 200,
}) => {
  const stats = directorStats || {};
  const score = stats.reliability_score ?? calculateDirectorScore(stats);
  const priv = getDirectorPrivileges(score);

  if (priv.limitActive) {
    const activeCount = (existingActivities || []).filter(
      (a) =>
        a.ownerId === ownerId &&
        a.lifecycleStatus &&
        a.lifecycleStatus !== 'FINISHED' &&
        a.lifecycleStatus !== 'CANCELED' &&
        a.lifecycleStatus !== 'ARCHIVED'
    ).length;

    if (activeCount >= priv.limitActive) {
      return {
        ok: false,
        reason: 'ACTIVE_LIMIT',
        score,
        priv,
        activeCount,
        limitActive: priv.limitActive,
      };
    }
  }

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

  return {
    ok: true,
    score,
    priv,
    activityWithPolicy,
    depositRequired,
    depositMultiplier,
  };
};

