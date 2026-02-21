// ===== RENDER STATES (SECTIONED) =====

function renderStates() {
  const container = document.getElementById("stateButtons");
  container.innerHTML = "";

  STATES.forEach(section => {

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

      // Restore highlight
      if (activeStates[state.name]) {
        btn.classList.add("active");
      }

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

// ===== UPDATE RATE DISPLAY =====

function updateRateText(rateDiv, state) {
  if (state.type === "productive") {
    rateDiv.innerHTML =
      `<span class="earn">+${state.earn?.toFixed(2) || "0.00"}</span> /min`;
  }

  if (state.type === "relax") {
    const realBurn = state.burn
      ? (state.burn / relaxMultiplier).toFixed(2)
      : "0.00";

    rateDiv.innerHTML =
      `<span class="burn">-${realBurn}</span> /min`;
  }

  if (state.type === "neutral") {
    rateDiv.innerHTML = "";
  }
}

// ===== UPDATE UI =====

function updateUI() {
  document.getElementById("balance").innerText =
    balance.toFixed(2);

  document.getElementById("multiplier").innerText =
    relaxMultiplier.toFixed(2);

  document.getElementById("streak").innerText =
    streakDays;

  document.getElementById("productiveToday").innerText =
    productiveMinutesToday.toFixed(1);

  document.getElementById("relaxToday").innerText =
    relaxMinutesToday.toFixed(1);

  document.getElementById("activityFeed").innerText =
    activityLog.join("\n");

  // Update dynamic burn/earn display
  document.querySelectorAll(".button-grid button").forEach(btn => {
    const stateName = btn.firstChild.innerText;

    let stateObj = null;

    STATES.forEach(section => {
      section.items.forEach(item => {
        if (item.name === stateName) {
          stateObj = item;
        }
      });
    });

    const rateDiv = btn.querySelector(".rate");

    if (stateObj && rateDiv) {
      updateRateText(rateDiv, stateObj);
    }
  });
}

// ===== FULL REPORT EXPORT =====

function generateFullReport() {
  const report = `
===== STATE TRACKER REPORT =====

Balance: ${balance.toFixed(2)}
Multiplier: ${relaxMultiplier.toFixed(2)}
Streak Days: ${streakDays}

Productive Minutes Today: ${productiveMinutesToday.toFixed(2)}
Relax Minutes Today: ${relaxMinutesToday.toFixed(2)}

Active States:
${Object.keys(activeStates).length > 0
  ? Object.keys(activeStates).join(", ")
  : "None"}

Last Recorded Day: ${lastRecordedDay}

Recent Activity:
${activityLog.join("\n")}

===== RAW STORAGE SNAPSHOT =====
${JSON.stringify(localStorage, null, 2)}
`;

  navigator.clipboard.writeText(report)
    .then(() => {
      alert("Full report copied to clipboard.");
    })
    .catch(() => {
      alert("Copy failed.");
    });
}

// ===== INIT =====

document.addEventListener("DOMContentLoaded", () => {

  renderStates();
  updateUI();

  document.getElementById("resetDayBtn")
    .addEventListener("click", resetToday);

  document.getElementById("factoryResetBtn")
    .addEventListener("click", factoryReset);

  document.getElementById("copyDataBtn")
    .addEventListener("click", generateFullReport);

  // MENU TOGGLE
  const menuButton = document.getElementById("menuButton");
  const menuPanel = document.getElementById("menuPanel");
  const closeMenu = document.getElementById("closeMenu");

  if (menuButton && menuPanel && closeMenu) {
    menuButton.addEventListener("click", () => {
      menuPanel.classList.add("open");
    });

    closeMenu.addEventListener("click", () => {
      menuPanel.classList.remove("open");
    });
  }
});