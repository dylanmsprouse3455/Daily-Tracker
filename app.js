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

  const balanceEl = document.getElementById("balance");
  const multiplierEl = document.getElementById("multiplier");
  const streakEl = document.getElementById("streak");

  function renderDashboard() {
    const s = Engine.getState();
    balanceEl.textContent = "$" + (s.balance || 0).toFixed(2);
    multiplierEl.textContent = (s.multiplier || 1).toFixed(2) + "x";
    streakEl.textContent = String(s.streak || 0);
  }

  renderDashboard();
  setInterval(renderDashboard, 2500);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) Engine.tick();
  });
});