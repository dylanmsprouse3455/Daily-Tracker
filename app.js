document.addEventListener("DOMContentLoaded", () => {
  UI.init();

  // Menu
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

  // Dashboard
  const balanceEl = document.getElementById("balance");
  const multiplierEl = document.getElementById("multiplier");
  const streakEl = document.getElementById("streak");

  // Money toast (injected, no HTML edits)
  const toastWrap = document.createElement("div");
  toastWrap.style.position = "fixed";
  toastWrap.style.top = "70px";
  toastWrap.style.right = "14px";
  toastWrap.style.zIndex = "200";
  toastWrap.style.display = "flex";
  toastWrap.style.flexDirection = "column";
  toastWrap.style.gap = "8px";
  document.body.appendChild(toastWrap);

  let lastDeltaAt = 0;

  function pushToast(text, positive) {
    const t = document.createElement("div");
    t.textContent = text;
    t.style.padding = "10px 12px";
    t.style.borderRadius = "14px";
    t.style.border = "1px solid rgba(0,0,0,0.08)";
    t.style.background = "white";
    t.style.fontWeight = "900";
    t.style.boxShadow = "0 10px 24px rgba(0,0,0,0.10)";
    t.style.transform = "translateY(-6px)";
    t.style.opacity = "0";
    t.style.transition = "transform .2s ease, opacity .2s ease";
    t.style.color = positive ? "#166534" : "#991b1b";

    toastWrap.appendChild(t);

    requestAnimationFrame(() => {
      t.style.opacity = "1";
      t.style.transform = "translateY(0px)";
    });

    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(-6px)";
      setTimeout(() => t.remove(), 220);
    }, 1300);
  }

  function renderDashboard() {
    const s = Engine.getState();

    balanceEl.textContent = "$" + (s.balance || 0).toFixed(2);
    multiplierEl.textContent = (s.multiplier || 1).toFixed(2) + "x";
    streakEl.textContent = String(s.streak || 0);

    // show a toast only when there is a new delta
    const d = s.lastDelta || null;
    if (d && d.atMs && d.atMs !== lastDeltaAt) {
      lastDeltaAt = d.atMs;

      const net = d.net || 0;
      if (Math.abs(net) > 0.0001) {
        const sign = net >= 0 ? "+" : "-";
        pushToast(`${sign}$${Math.abs(net).toFixed(2)}`, net >= 0);
      }
    }
  }

  renderDashboard();
  setInterval(renderDashboard, 2500);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) Engine.tick();
  });
});