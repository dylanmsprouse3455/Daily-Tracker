document.addEventListener("DOMContentLoaded", () => {
  UI.init();

  const menuBtn = document.getElementById("menuBtn");
  const menuPanel = document.getElementById("menuPanel");
  const menuOverlay = document.getElementById("menuOverlay");
  const menuClose = document.getElementById("menuClose");

  const openMenu = () => {
    menuPanel.classList.add("open");
    menuOverlay.classList.add("open");
    menuPanel.setAttribute("aria-hidden", "false");
  };

  const closeMenu = () => {
    menuPanel.classList.remove("open");
    menuOverlay.classList.remove("open");
    menuPanel.setAttribute("aria-hidden", "true");
  };

  menuBtn.addEventListener("click", openMenu);
  menuClose.addEventListener("click", closeMenu);
  menuOverlay.addEventListener("click", closeMenu);

  document.getElementById("copyDataBtn").addEventListener("click", () => {
    const data = Engine.exportAll();
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text)
      .then(() => alert("Copied JSON to clipboard."))
      .catch(() => alert("Copy failed."));
  });

  document.getElementById("factoryResetBtn").addEventListener("click", () => {
    if (!confirm("Erase all local data?")) return;
    Engine.resetAll();
    location.reload();
  });

  // ===== Dashboard elements =====
  const balanceEl = document.getElementById("balance");
  const multiplierEl = document.getElementById("multiplier");
  const streakEl = document.getElementById("streak");

  // ===== Money flow HUD (top-right, next to menu) =====
  const hud = document.createElement("div");
  hud.className = "flow-hud";
  hud.innerHTML = `
    <div class="net" id="flowNet">+0.00</div>
    <div class="sub" id="flowSub">earned 0.00 | lost 0.00</div>
  `;
  document.body.appendChild(hud);

  const flowNet = document.getElementById("flowNet");
  const flowSub = document.getElementById("flowSub");

  function renderDashboard() {
    const s = Engine.getState();

    balanceEl.textContent = "$" + (s.balance || 0).toFixed(2);
    multiplierEl.textContent = (s.multiplier || 1).toFixed(2) + "x";
    streakEl.textContent = String(s.streak || 0);

    // Show last flow (earned/burned) if engine provides it
    const f = s.lastFlow || s.lastDelta || null;

    if (f) {
      const net = (typeof f.net === "number") ? f.net : 0;
      const earned = (typeof f.earned === "number") ? f.earned : 0;
      const burned = (typeof f.burned === "number") ? f.burned : 0;

      const sign = net >= 0 ? "+" : "";
      flowNet.textContent = `${sign}${net.toFixed(2)}`;
      flowSub.textContent = `earned ${earned.toFixed(2)} | lost ${burned.toFixed(2)}`;

      // optional: color the net text
      flowNet.style.color = net >= 0 ? "#166534" : "#991b1b";
    } else {
      flowNet.textContent = "+0.00";
      flowSub.textContent = "earned 0.00 | lost 0.00";
      flowNet.style.color = "#111";
    }
  }

  renderDashboard();
  setInterval(renderDashboard, 1500);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) Engine.tick();
  });
});