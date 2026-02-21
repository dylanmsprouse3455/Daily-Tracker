function renderStates() {
  const container = document.getElementById("stateButtons");
  container.innerHTML = "";

  STATE_SECTIONS.forEach(section => {
    const sectionTitle = document.createElement("h3");
    sectionTitle.innerText = section.section;
    sectionTitle.classList.add("section-title");
    container.appendChild(sectionTitle);

    const sectionGrid = document.createElement("div");
    sectionGrid.classList.add("button-grid");

    section.items.forEach(state => {
      const btn = document.createElement("button");
      btn.classList.add(state.type);

      const nameDiv = document.createElement("div");
      nameDiv.innerText = state.name;

      const rateDiv = document.createElement("div");
      rateDiv.classList.add("rate");

      updateRateText(rateDiv, state);

      btn.appendChild(nameDiv);
      btn.appendChild(rateDiv);

      if (activeStates[state.name]) btn.classList.add("active");

      btn.onclick = () => {
        if (activeStates[state.name]) {
          delete activeStates[state.name];
          btn.classList.remove("active");
        } else {
          activeStates[state.name] = true;
          btn.classList.add("active");
        }
        Storage.set("activeStates", activeStates);
      };

      sectionGrid.appendChild(btn);
    });

    container.appendChild(sectionGrid);
  });
}

function updateRateText(rateDiv, state) {
  if (state.type === "productive") {
    const earn = Number(state.earn || 0).toFixed(2);
    rateDiv.innerHTML = `<span class="earn">+${earn}</span> /min`;
  }

  if (state.type === "relax") {
    const burnBase = Number(state.burn || 0);
    const realBurn = (burnBase / relaxMultiplier).toFixed(2);
    rateDiv.innerHTML = `<span class="burn">-${realBurn}</span> /min`;
  }

  if (state.type === "neutral") {
    rateDiv.innerHTML = "";
  }
}

function updateUI() {
  document.getElementById("balance").innerText = balance.toFixed(2);
  document.getElementById("multiplier").innerText = relaxMultiplier.toFixed(2);
  document.getElementById("streak").innerText = streakDays;
  document.getElementById("productiveToday").innerText = productiveMinutesToday.toFixed(1);
  document.getElementById("relaxToday").innerText = relaxMinutesToday.toFixed(1);
  document.getElementById("activityFeed").innerText = activityLog.join("\n");

  // Update rate text dynamically as multiplier changes
  document.querySelectorAll(".button-grid button").forEach(btn => {
    const stateName = btn.firstChild.innerText;

    let found = null;
    STATE_SECTIONS.forEach(sec => {
      sec.items.forEach(item => {
        if (item.name === stateName) found = item;
      });
    });

    const rateDiv = btn.querySelector(".rate");
    if (found && rateDiv) updateRateText(rateDiv, found);
  });
}

function generateFullReport() {
  const lifetime = Storage.get("lifetime", {});
  const stateTotals = Storage.get("stateTotals", {});

  const report = `
===== STATE TRACKER REPORT =====

Balance: ${balance.toFixed(2)}
Multiplier: ${relaxMultiplier.toFixed(2)}
Streak Days: ${streakDays}

Productive Minutes Today: ${productiveMinutesToday.toFixed(2)}
Relax Minutes Today: ${relaxMinutesToday.toFixed(2)}

Lifetime Totals:
Total Minutes: ${(lifetime.totalMinutes || 0).toFixed(2)}
Productive Minutes: ${(lifetime.productiveMinutes || 0).toFixed(2)}
Relax Minutes: ${(lifetime.relaxMinutes || 0).toFixed(2)}
Earned: ${(lifetime.earned || 0).toFixed(2)}
Burned: ${(lifetime.burned || 0).toFixed(2)}

Active States:
${Object.keys(activeStates).length ? Object.keys(activeStates).join(", ") : "None"}

Last Recorded Day: ${lastRecordedDay}

Recent Activity:
${activityLog.join("\n")}

Top States (by minutes):
${Object.entries(stateTotals)
  .sort((a,b) => (b[1].minutes || 0) - (a[1].minutes || 0))
  .slice(0, 12)
  .map(([name, v]) => `${name}: ${(v.minutes || 0).toFixed(2)} min`)
  .join("\n")}
`;

  navigator.clipboard.writeText(report)
    .then(() => alert("Full report copied to clipboard."))
    .catch(() => alert("Copy failed."));
}

document.addEventListener("DOMContentLoaded", () => {
  renderStates();
  updateUI();

  document.getElementById("resetDayBtn").addEventListener("click", resetToday);
  document.getElementById("factoryResetBtn").addEventListener("click", factoryReset);
  document.getElementById("copyDataBtn").addEventListener("click", generateFullReport);

  const menuButton = document.getElementById("menuButton");
  const menuPanel = document.getElementById("menuPanel");
  const closeMenu = document.getElementById("closeMenu");

  if (menuButton && menuPanel && closeMenu) {
    menuButton.addEventListener("click", () => menuPanel.classList.add("open"));
    closeMenu.addEventListener("click", () => menuPanel.classList.remove("open"));
  }
});