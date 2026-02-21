function animateMoney(element, target) {
  let current = 0;
  const steps = 70;
  const inc = target / steps;

  let i = 0;
  const timer = setInterval(() => {
    i++;
    current += inc;
    if (i >= steps) {
      current = target;
      clearInterval(timer);
    }
    element.innerText = "$" + current.toFixed(2);
  }, 16);
}

function makeTopBarRow(labelText, percent) {
  const wrap = document.createElement("div");
  wrap.classList.add("top-state");

  const label = document.createElement("div");
  label.innerText = labelText;

  const bar = document.createElement("div");
  bar.classList.add("top-bar");

  const fill = document.createElement("div");
  fill.classList.add("top-bar-fill");
  bar.appendChild(fill);

  wrap.appendChild(label);
  wrap.appendChild(bar);

  setTimeout(() => {
    fill.style.width = Math.max(0, Math.min(100, percent)) + "%";
  }, 150);

  return wrap;
}

function loadAnalytics() {
  const balance = Number(Storage.get("balance", 0));
  const multiplier = Number(Storage.get("multiplier", 1));
  const streak = Number(Storage.get("streakDays", 0));

  const lifetime = Storage.get("lifetime", {
    totalMinutes: 0,
    productiveMinutes: 0,
    relaxMinutes: 0,
    earned: 0,
    burned: 0
  });

  const stateTotals = Storage.get("stateTotals", {});
  const comboTotals = Storage.get("comboTotals", {});

  animateMoney(document.getElementById("a_balance"), balance);

  const total = Number(lifetime.totalMinutes || 0);
  const net = Number(lifetime.earned || 0) - Number(lifetime.burned || 0);
  const efficiency = total > 0 ? (net / total) : 0;

  document.getElementById("a_efficiency").innerText =
    `Net Efficiency: ${efficiency.toFixed(2)} per minute (Earned minus Burned)`;

  const prod = Number(lifetime.productiveMinutes || 0);
  const relax = Number(lifetime.relaxMinutes || 0);
  const totalTracked = prod + relax;

  const prodPct = totalTracked > 0 ? (prod / totalTracked) * 100 : 0;
  const relaxPct = totalTracked > 0 ? (relax / totalTracked) * 100 : 0;

  const bar = document.getElementById("dominantBar");
  const dominantPct = Math.max(prodPct, relaxPct);

  setTimeout(() => {
    bar.style.width = dominantPct + "%";

    if (relaxPct > prodPct) {
      bar.classList.remove("productive-bar");
      bar.classList.add("relax-dominant");
    } else {
      bar.classList.remove("relax-dominant");
      bar.classList.add("productive-bar");
    }
  }, 200);

  document.getElementById("distributionText").innerText =
    `Productive: ${prodPct.toFixed(1)}% | Relax: ${relaxPct.toFixed(1)}%`;

  document.getElementById("a_multiplier").innerText = `Multiplier: ${multiplier.toFixed(2)}`;
  document.getElementById("a_streak").innerText = `Streak Days: ${streak}`;

  // Top Primary States
  const topStatesContainer = document.getElementById("topStatesContainer");
  topStatesContainer.innerHTML = "";

  const primaryEntries = Object.entries(stateTotals)
    .map(([id, v]) => ({ id, v }))
    .filter(x => findStateById(x.id)?.kind === "primary")
    .sort((a, b) => (b.v.minutes || 0) - (a.v.minutes || 0))
    .slice(0, 10);

  const maxMin = primaryEntries.length ? (primaryEntries[0].v.minutes || 1) : 1;

  for (const item of primaryEntries) {
    const s = findStateById(item.id);
    const mins = Number(item.v.minutes || 0);
    const earned = Number(item.v.earned || 0);
    const burned = Number(item.v.burned || 0);
    const label = `${s?.name || item.id} | ${mins.toFixed(1)} min | +${earned.toFixed(2)} | -${burned.toFixed(2)}`;
    const pct = (mins / maxMin) * 100;
    topStatesContainer.appendChild(makeTopBarRow(label, pct));
  }

  if (!primaryEntries.length) {
    topStatesContainer.innerText = "No primary data yet. Run a primary state for a minute.";
  }

  // Top Combos
  const topCombosContainer = document.getElementById("topCombosContainer");
  topCombosContainer.innerHTML = "";

  const comboEntries = Object.entries(comboTotals)
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => (b.v.minutes || 0) - (a.v.minutes || 0))
    .slice(0, 10);

  const maxComboMin = comboEntries.length ? (comboEntries[0].v.minutes || 1) : 1;

  for (const item of comboEntries) {
    const mins = Number(item.v.minutes || 0);
    const earned = Number(item.v.earned || 0);
    const burned = Number(item.v.burned || 0);

    const [primaryId, mods] = item.k.split("::");
    const primaryName = findStateById(primaryId)?.name || "None";
    const modNames = (mods && mods !== "none")
      ? mods.split("|").map(id => findStateById(id)?.name || id).join(", ")
      : "None";

    const label = `${primaryName} + [${modNames}] | ${mins.toFixed(1)} min | +${earned.toFixed(2)} | -${burned.toFixed(2)}`;
    const pct = (mins / maxComboMin) * 100;
    topCombosContainer.appendChild(makeTopBarRow(label, pct));
  }

  if (!comboEntries.length) {
    topCombosContainer.innerText = "No combo data yet. Select modifiers and let it run.";
  }
}

document.addEventListener("DOMContentLoaded", loadAnalytics);