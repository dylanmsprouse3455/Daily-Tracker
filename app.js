// ===== RENDER STATES =====

function renderStates() {
  const container = document.getElementById("stateButtons");
  container.innerHTML = "";

  STATES.forEach(state => {
    const btn = document.createElement("button");
    btn.classList.add(state.type);

    const nameDiv = document.createElement("div");
    nameDiv.innerText = state.name;

    const rateDiv = document.createElement("div");
    rateDiv.classList.add("rate");

    updateRateText(rateDiv, state);

    btn.appendChild(nameDiv);
    btn.appendChild(rateDiv);

    // Restore highlight if active
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

    container.appendChild(btn);
  });
}

// ===== UPDATE RATE DISPLAY =====

function updateRateText(rateDiv, state) {
  if (state.type === "productive") {
    rateDiv.innerHTML =
      `<span class="earn">+${state.earn.toFixed(2)}</span> /min`;
  }

  if (state.type === "relax") {
    const realBurn = (state.burn / relaxMultiplier).toFixed(2);
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

  // Update burn values dynamically as multiplier changes
  document.querySelectorAll(".button-grid button").forEach(btn => {
    const stateName = btn.firstChild.innerText;
    const state = STATES.find(s => s.name === stateName);
    const rateDiv = btn.querySelector(".rate");

    if (state && rateDiv) {
      updateRateText(rateDiv, state);
    }
  });
}

// ===== INIT =====

document.addEventListener("DOMContentLoaded", () => {

  renderStates();
  updateUI();

  // Reset Buttons
  document.getElementById("resetDayBtn")
    .addEventListener("click", resetToday);

  document.getElementById("factoryResetBtn")
    .addEventListener("click", factoryReset);

  // Menu Toggle
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