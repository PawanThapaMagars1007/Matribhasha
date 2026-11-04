const DEFAULTS = Object.freeze({ againMinutes: 10, masteredRepetitions: 5, masteredIntervalDays: 21, maximumIntervalDays: 365 });

export function scheduleReview(rating, current = {}, now = new Date(), config = {}) {
  const settings = { ...DEFAULTS, ...config };
  const currentInterval = Math.max(0, Number(current.intervalDays) || 0);
  let repetitions = Math.max(0, Number(current.repetitions) || 0);
  let intervalDays = 0;
  let status = 'learning';
  let nextReviewAt;

  if (rating === 'again') {
    repetitions = 0; intervalDays = 0; status = 'needs-revision';
    nextReviewAt = new Date(now.getTime() + settings.againMinutes * 60 * 1000);
  } else {
    repetitions += 1;
    if (rating === 'hard') intervalDays = Math.max(1, Math.ceil(currentInterval * 1.2));
    else if (rating === 'good') intervalDays = currentInterval === 0 ? 1 : Math.ceil(currentInterval * 2);
    else if (rating === 'easy') intervalDays = currentInterval === 0 ? 3 : Math.ceil(currentInterval * 2.5);
    else throw new TypeError('Unsupported review rating.');
    intervalDays = Math.min(settings.maximumIntervalDays, intervalDays);
    status = repetitions >= settings.masteredRepetitions && intervalDays >= settings.masteredIntervalDays && rating !== 'hard' ? 'mastered' : rating === 'hard' ? 'learning' : 'familiar';
    nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  }
  return { repetitions, intervalDays, status, nextReviewAt };
}

export function defaultReviewConfig(env = process.env) {
  return {
    againMinutes: boundedInt(env.SPACED_REPETITION_AGAIN_MINUTES, DEFAULTS.againMinutes, 1, 1440),
    masteredRepetitions: boundedInt(env.SPACED_REPETITION_MASTERED_REPETITIONS, DEFAULTS.masteredRepetitions, 2, 30),
    masteredIntervalDays: boundedInt(env.SPACED_REPETITION_MASTERED_DAYS, DEFAULTS.masteredIntervalDays, 1, 365),
    maximumIntervalDays: boundedInt(env.SPACED_REPETITION_MAX_DAYS, DEFAULTS.maximumIntervalDays, 7, 365),
  };
}

function boundedInt(value, fallback, min, max) { const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback; }
