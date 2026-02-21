let balance = Storage.get("balance", 0);
let productiveMinutesToday = Storage.get("productiveToday", 0);
let relaxMinutesToday = Storage.get("relaxToday", 0);
let streakDays = Storage.get("streakDays", 0);
let relaxMultiplier = Storage.get("multiplier", 1);
let activityLog = Storage.get("activityLog", []);
let lastRecordedDay = Storage.get("lastRecordedDay", new Date().toDateString());
let activeStates = Storage.get("activeStates", {});   // ✅ FIXED

let lastTick = Date.now();

// ===== FLOATING MONEY EFFECT =====

function showMoneyFlow(amount, type) {
  const container = document.getElementById("moneyFlowContainer");
  if (!container) return;

  const pop = document.createElement("div");
  pop.classList.add("money-pop");

  if (type === "earn") {
    pop.classList.add("money-earn");
    pop.innerText = `+$${amount.toFixed(2)}`;
  } else {
    pop.classList.add("money-burn");
    pop.innerText = `-$${amount.toFixed(2)}`;
  }

  container.appendChild(pop);

  setTimeout(() => pop.remove(), 1200);
}

// ===== MAIN TICK ENGINE =====

function tick() {
  checkDailyRollover();

  const now = Date.now();
  const minutes = (now - lastTick) / 60000;
  lastTick = now;

  STATES.forEach(state => {
    if (!activeStates[state.name]) return;

    if (state.type === "productive") {
      productiveMinutesToday += minutes;

      const earned = minutes * state.earn;
      balance += earned;

      showMoneyFlow(earned, "earn");

      relaxMultiplier =
        1 + (streakDays * 0.5) + (productiveMinutesToday / 180);

      logActivity(`+${earned.toFixed(2)} from ${state.name}`);
    }

    if (state.type === "relax") {
      relaxMinutesToday += minutes;

      const burn = state.burn / relaxMultiplier;
      const burned = minutes * burn;

      balance -= burned;

      showMoneyFlow(burned, "burn");

      logActivity(`-${burned.toFixed(2)} from ${state.name}`);
    }
  });

  checkPenalty();
  saveAll();
  updateUI();
}

// ===== PENALTY SYSTEM =====

function checkPenalty() {
  if (relaxMinutesToday > productiveMinutesToday) {
    relaxMultiplier *= 0.9;
    if (relaxMultiplier < 1) relaxMultiplier = 1;
    logActivity("Penalty Applied");
  }
}

// ===== DAILY ROLLOVER =====

function checkDailyRollover() {
  const today = new Date().toDateString();

  if (today !== lastRecordedDay) {

    if (productiveMinutesToday > relaxMinutesToday) {
      streakDays++;
      logActivity("Streak +1 (Productive Day)");
    } else {
      relaxMultiplier *= 0.7;
      if (relaxMultiplier < 1) relaxMultiplier = 1;
      logActivity("Day Penalty Applied");
    }

    productiveMinutesToday = 0;
    relaxMinutesToday = 0;
    lastRecordedDay = today;

    Storage.set("lastRecordedDay", today);
  }
}

// ===== ACTIVITY LOGGER =====

function logActivity(message) {
  activityLog.unshift(
    `${new Date().toLocaleTimeString()} - ${message}`
  );

  if (activityLog.length > 15) {
    activityLog.pop();
  }
}

// ===== SAVE STATE =====

function saveAll() {
  Storage.set("balance", balance);
  Storage.set("productiveToday", productiveMinutesToday);
  Storage.set("relaxToday", relaxMinutesToday);
  Storage.set("streakDays", streakDays);
  Storage.set("multiplier", relaxMultiplier);
  Storage.set("activityLog", activityLog);
  Storage.set("activeStates", activeStates);   // ✅ FIXED
}

// ===== RESET =====

function resetToday() {
  productiveMinutesToday = 0;
  relaxMinutesToday = 0;
  logActivity("Manual Day Reset");
  saveAll();
  updateUI();
}

function factoryReset() {
  if (!confirm("Erase ALL data?")) return;
  Storage.clearAll();
  location.reload();
}

setInterval(tick, 5000);