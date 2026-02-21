// ===== SESSION-BASED ENGINE =====

let currentSession = Storage.get("currentSession", null);
let sessions = Storage.get("sessions", []);
let dailyTotals = Storage.get("dailyTotals", {
  date: new Date().toDateString(),
  productive: 0,
  relax: 0
});

// ===== START SESSION =====
function startSession(data) {

  if (currentSession) {
    endSession();
  }

  currentSession = {
    ...data,
    startTime: Date.now()
  };

  Storage.set("currentSession", currentSession);
}

// ===== END SESSION =====
function endSession() {

  if (!currentSession) return;

  const endTime = Date.now();
  const durationMinutes =
    (endTime - currentSession.startTime) / 60000;

  const record = {
    ...currentSession,
    endTime,
    durationMinutes
  };

  sessions.push(record);

  if (currentSession.type === "productive") {
    dailyTotals.productive += durationMinutes;
  }

  if (currentSession.type === "relax") {
    dailyTotals.relax += durationMinutes;
  }

  currentSession = null;

  Storage.set("sessions", sessions);
  Storage.set("currentSession", null);
  Storage.set("dailyTotals", dailyTotals);
}

// ===== DAILY ROLLOVER =====
function checkDailyRollover() {

  const today = new Date().toDateString();

  if (dailyTotals.date !== today) {

    const history = Storage.get("history", []);
    history.push(dailyTotals);
    Storage.set("history", history);

    dailyTotals = {
      date: today,
      productive: 0,
      relax: 0
    };

    Storage.set("dailyTotals", dailyTotals);
  }
}

// ===== LIVE TOTALS =====
function getLiveDailyTotals() {

  checkDailyRollover();

  let productive = dailyTotals.productive;
  let relax = dailyTotals.relax;

  if (currentSession) {

    const extra =
      (Date.now() - currentSession.startTime) / 60000;

    if (currentSession.type === "productive") {
      productive += extra;
    }

    if (currentSession.type === "relax") {
      relax += extra;
    }
  }

  return { productive, relax };
}

// ===== RESUME CHECK =====
function resumeSessionIfExists() {

  if (!currentSession) return;

  const minutesRunning =
    (Date.now() - currentSession.startTime) / 60000;

  if (minutesRunning > 180) {
    const still = confirm(
      "You've been in this state over 3 hours.\nStill doing it?"
    );

    if (!still) {
      endSession();
    }
  }
}