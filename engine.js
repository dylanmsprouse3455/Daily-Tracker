const Engine = (() => {
  const STATE_KEY = "brain_state_v1";

  const MULT_MIN = 1.0;
  const MULT_MAX = 9.0;

  const EARN_DEFAULT = 1.2;
  const BURN_DEFAULT = 1.2;

  function defaultActivityMeta() {
    return {
      "Focused Work": { type: "productive", earn: 1.8 },
      "Emails/Admin": { type: "productive", earn: 1.2 },
      "Learning": { type: "productive", earn: 1.4 },
      "Studying": { type: "productive", earn: 1.4 },
      "Planning": { type: "productive", earn: 1.2 },
      "Cleaning": { type: "productive", earn: 1.2 },
      "Laundry": { type: "productive", earn: 1.0 },
      "Dishes": { type: "productive", earn: 1.0 },
      "Cooking": { type: "productive", earn: 1.1 },
      "Shopping": { type: "productive", earn: 0.9 },
      "Errands": { type: "productive", earn: 0.9 },
      "Workout": { type: "productive", earn: 1.6 },
      "Stretching": { type: "productive", earn: 0.8 },
      "Drawing": { type: "productive", earn: 1.1 },
      "Creative Project": { type: "productive", earn: 1.2 },
      "Reading": { type: "productive", earn: 1.1 },

      "Phone": { type: "relax", burn: 1.4 },
      "Scrolling": { type: "relax", burn: 1.8 },
      "Media": { type: "relax", burn: 1.3 },
      "TV": { type: "relax", burn: 1.2 },
      "Gaming": { type: "relax", burn: 1.4 },
      "Nap": { type: "relax", burn: 1.0 },
      "Sleeping": { type: "relax", burn: 0.6 },
      "In Bed Awake": { type: "relax", burn: 1.0 },
      "Idle": { type: "relax", burn: 1.6 },

      "Conversation": { type: "neutral" },
      "Socializing": { type: "neutral" },
      "Music": { type: "neutral" },
      "Podcast": { type: "neutral" },
      "Eating": { type: "neutral" },
      "Shower/Get Ready": { type: "neutral" },
      "Commuting": { type: "neutral" },
      "Waiting": { type: "neutral" }
    };
  }

  function defaultState() {
    return {
      balance: 0,
      multiplier: 1.0,
      streak: 0,

      active: { location: null, movement: null, activity: [] },

      currentSession: null, // { startMs, lastAccrualMs, active }
      sessions: [],

      dayKey: new Date().toDateString(),
      productiveMins: 0,
      relaxMins: 0,

      activityMeta: defaultActivityMeta(),

      // NEW: last delta (for UI money movement)
      lastDelta: {
        atMs: 0,
        minutes: 0,
        earned: 0,
        burned: 0,
        net: 0
      }
    };
  }

  function load() { return Storage.get(STATE_KEY, defaultState()); }
  function save(s) { Storage.set(STATE_KEY, s); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function recomputeMultiplier(s) {
    const mult = 1 + (s.streak * 0.5) + (s.productiveMins / 180);
    s.multiplier = clamp(mult, MULT_MIN, MULT_MAX);
  }

  function rolloverIfNeeded(s) {
    const today = new Date().toDateString();
    if (s.dayKey === today) return s;

    const now = Date.now();

    if (s.currentSession) {
      endCurrentSession(s, now);
      startNewSession(s, now, s.active);
    }

    const tracked = s.productiveMins + s.relaxMins;
    if (tracked > 0 && s.productiveMins >= s.relaxMins) s.streak += 1;
    else s.streak = 0;

    s.dayKey = today;
    s.productiveMins = 0;
    s.relaxMins = 0;

    recomputeMultiplier(s);
    return s;
  }

  // Fallback classifier so every activity has meaning
  function getMeta(s, act) {
    if (s.activityMeta && s.activityMeta[act]) return s.activityMeta[act];

    const a = String(act || "").toLowerCase();

    if (
      a.includes("phone") || a.includes("scroll") || a.includes("media") ||
      a.includes("tv") || a.includes("gaming") || a.includes("nap") ||
      a.includes("sleep") || a.includes("idle") || a.includes("bed")
    ) return { type: "relax", burn: BURN_DEFAULT };

    if (
      a.includes("work") || a.includes("learn") || a.includes("study") ||
      a.includes("clean") || a.includes("laundry") || a.includes("dish") ||
      a.includes("cook") || a.includes("shopping") || a.includes("errand") ||
      a.includes("plan") || a.includes("draw") || a.includes("creative") ||
      a.includes("read") || a.includes("admin") || a.includes("email") ||
      a.includes("exercise") || a.includes("workout")
    ) return { type: "productive", earn: EARN_DEFAULT };

    return { type: "neutral" };
  }

  function accrueMinutes(s, minutes, activeSnapshot) {
    if (!minutes || minutes <= 0) return;

    const acts = Array.isArray(activeSnapshot.activity) ? activeSnapshot.activity : [];
    if (!acts.length) return;

    const share = minutes / acts.length;

    let prodMin = 0;
    let relaxMin = 0;
    let earned = 0;
    let burned = 0;

    acts.forEach(act => {
      const meta = getMeta(s, act);

      if (meta.type === "productive") {
        const rate = (typeof meta.earn === "number") ? meta.earn : EARN_DEFAULT;
        prodMin += share;
        earned += share * rate;
      } else if (meta.type === "relax") {
        const rate = (typeof meta.burn === "number") ? meta.burn : BURN_DEFAULT;
        relaxMin += share;
        burned += share * rate;
      }
    });

    burned = burned / Math.max(1, s.multiplier);

    s.productiveMins += prodMin;
    s.relaxMins += relaxMin;

    s.balance += earned;
    s.balance -= burned;

    const net = earned - burned;
    s.lastDelta = {
      atMs: Date.now(),
      minutes,
      earned,
      burned,
      net
    };

    recomputeMultiplier(s);
  }

  function startNewSession(s, nowMs, activeSnapshot) {
    s.currentSession = {
      startMs: nowMs,
      lastAccrualMs: nowMs,
      active: activeSnapshot
    };
  }

  function endCurrentSession(s, nowMs) {
    if (!s.currentSession) return;

    const last = s.currentSession.lastAccrualMs ?? s.currentSession.startMs;
    const minutes = (nowMs - last) / 60000;
    accrueMinutes(s, minutes, s.currentSession.active);

    const durationMin = (nowMs - s.currentSession.startMs) / 60000;

    // include delta snapshot for analytics later
    const delta = s.lastDelta ? { ...s.lastDelta } : { atMs: nowMs, minutes: 0, earned: 0, burned: 0, net: 0 };

    s.sessions.push({
      startMs: s.currentSession.startMs,
      endMs: nowMs,
      durationMin,
      active: s.currentSession.active,
      delta
    });

    if (s.sessions.length > 4000) s.sessions = s.sessions.slice(-4000);

    s.currentSession = null;
  }

  function tick() {
    let s = load();
    s = rolloverIfNeeded(s);

    if (!s.currentSession) {
      save(s);
      return s;
    }

    const now = Date.now();
    const last = s.currentSession.lastAccrualMs ?? s.currentSession.startMs;
    const minutes = (now - last) / 60000;

    if (minutes > 0) {
      accrueMinutes(s, minutes, s.currentSession.active);
      s.currentSession.lastAccrualMs = now;
    }

    save(s);
    return s;
  }

  function setActive(activeSnapshot) {
    let s = load();
    s = rolloverIfNeeded(s);

    const now = Date.now();

    const same =
      JSON.stringify(s.active.location) === JSON.stringify(activeSnapshot.location) &&
      JSON.stringify(s.active.movement) === JSON.stringify(activeSnapshot.movement) &&
      JSON.stringify(s.active.activity) === JSON.stringify(activeSnapshot.activity);

    if (same) return s;

    if (s.currentSession) endCurrentSession(s, now);

    s.active = activeSnapshot;

    if (Array.isArray(activeSnapshot.activity) && activeSnapshot.activity.length) {
      startNewSession(s, now, activeSnapshot);
    } else {
      s.currentSession = null;
    }

    save(s);
    return s;
  }

  function getState() { return tick(); }
  function resetAll() { Storage.remove(STATE_KEY); }
  function exportAll() { return getState(); }

  return { setActive, getState, tick, resetAll, exportAll };
})();