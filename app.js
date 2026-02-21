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

  // Copy data
  document.getElementById("copyDataBtn").addEventListener("click", () => {
    const data = Engine.exportAll();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      .then(() => alert("Copied JSON to clipboard."))
      .catch(() => alert("Copy failed."));
  });

  // Factory reset
  document.getElementById("factoryResetBtn").addEventListener("click", () => {
    if (!confirm("Erase all local data?")) return;
    Engine.resetAll();
    location.reload();
  });

  // Dashboard live render
  const balanceEl = document.getElementById("balance");
  const multiplierEl = document.getElementById("multiplier");
  const streakEl = document.getElementById("streak");

  function render() {
    const s = Engine.getState(); // includes tick
    balanceEl.textContent = "$" + (s.balance || 0).toFixed(2);
    multiplierEl.textContent = (s.multiplier || 1).toFixed(2) + "x";
    streakEl.textContent = String(s.streak || 0);
  }

  render();
  setInterval(render, 2500);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) Engine.tick();
  });
});