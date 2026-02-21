function animateNumber(element, target) {
  let current = 0;
  const increment = target / 60;

  const interval = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    element.innerText = "$" + current.toFixed(2);
  }, 16);
}

function loadAnalytics() {

  const balance = Number(Storage.get("balance", 0));
  const lifetime = Storage.get("lifetime", {
    totalMinutes: 0,
    productiveMinutes: 0,
    relaxMinutes: 0,
    earned: 0,
    burned: 0
  });

  const stateTotals = Storage.get("stateTotals", {});
  const multiplier = Number(Storage.get("multiplier", 1));
  const streak = Number(Storage.get("streakDays", 0));

  // Animate balance
  animateNumber(document.getElementById("a_balance"), balance);

  // Efficiency score
  const efficiency = lifetime.totalMinutes > 0
    ? (lifetime.earned - lifetime.burned) / lifetime.totalMinutes
    : 0;

  document.getElementById("a_efficiency").innerText =
    "Efficiency Score: " + efficiency.toFixed(2) + " per minute";

  // Distribution bars
  const totalTime = lifetime.productiveMinutes + lifetime.relaxMinutes;

  const prodPercent = totalTime > 0
    ? (lifetime.productiveMinutes / totalTime) * 100
    : 0;

  const relaxPercent = totalTime > 0
    ? (lifetime.relaxMinutes / totalTime) * 100
    : 0;

  setTimeout(() => {
    document.getElementById("productiveBar").style.width =
      prodPercent + "%";

    document.getElementById("relaxBar").style.width =
      relaxPercent + "%";
  }, 200);

  document.getElementById("distributionText").innerText =
    "Productive: " + prodPercent.toFixed(1) + "% | Relax: " +
    relaxPercent.toFixed(1) + "%";

  // Multiplier
  document.getElementById("a_multiplier").innerText =
    "Multiplier: " + multiplier.toFixed(2);

  document.getElementById("a_streak").innerText =
    "Streak Days: " + streak;

  // Top States
  const container = document.getElementById("topStatesContainer");

  const sorted = Object.entries(stateTotals)
    .sort((a,b) => (b[1].minutes || 0) - (a[1].minutes || 0))
    .slice(0, 10);

  const maxMinutes = sorted.length > 0
    ? sorted[0][1].minutes
    : 1;

  sorted.forEach(([name, data]) => {

    const wrapper = document.createElement("div");
    wrapper.classList.add("top-state");

    const label = document.createElement("div");
    label.innerText = name + " — " + data.minutes.toFixed(2) + " min";

    const bar = document.createElement("div");
    bar.classList.add("top-bar");

    const fill = document.createElement("div");
    fill.classList.add("top-bar-fill");

    bar.appendChild(fill);
    wrapper.appendChild(label);
    wrapper.appendChild(bar);
    container.appendChild(wrapper);

    setTimeout(() => {
      fill.style.width = (data.minutes / maxMinutes) * 100 + "%";
    }, 200);
  });
}

document.addEventListener("DOMContentLoaded", loadAnalytics);