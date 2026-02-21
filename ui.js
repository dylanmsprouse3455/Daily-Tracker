const UI = (() => {
  const DATA = {
    location: [
      "Home","Work","Car","Out",
      "Front Room","Bedroom","Kitchen","Bathroom","Porch","Yard","Garage","Office",
      "Store","Restaurant","Gym","Friend House","Family House","Other"
    ],
    movement: [
      "Stationary","Walking","Driving","Passenger","Running","Cycling","Transit"
    ],
    activity: [
      "Focused Work","Emails/Admin","Learning","Studying","Planning",
      "Drawing","Creative Project","Reading",
      "Cleaning","Laundry","Dishes","Cooking","Shopping","Errands",
      "Workout","Stretching",
      "Conversation","Socializing",
      "Music","Podcast",
      "Phone","Scrolling","Media","TV","Gaming",
      "Eating","Shower/Get Ready",
      "Nap","Sleeping","In Bed Awake",
      "Idle","Waiting","Commuting"
    ]
  };

  const categories = Object.keys(DATA);

  let selected = {
    location: null,
    movement: null,
    activity: new Set()
  };

  let categoryIndex = 0;
  let optionIndex = 0;

  const catCarousel = document.getElementById("categoryCarousel");
  const optCarousel = document.getElementById("optionCarousel");
  const catTrack = document.getElementById("categoryTrack");
  const optTrack = document.getElementById("optionTrack");
  const activeBar = document.getElementById("activeBar");
  const currentStatesEl = document.getElementById("currentStates");
  const activityPanel = document.getElementById("activityPanel");

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function snap(track, index) {
    track.style.transition = "transform .25s cubic-bezier(.2,.8,.2,1)";
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  function activeSnapshot() {
    return {
      location: selected.location,
      movement: selected.movement,
      activity: Array.from(selected.activity)
    };
  }

  function pushToBrain() {
    Engine.setActive(activeSnapshot());
  }

  function fmtRate(meta, multiplier) {
    if (!meta) return "0";
    if (meta.type === "productive") {
      const r = (typeof meta.earn === "number") ? meta.earn : 1.2;
      return `+${r.toFixed(1)}/min`;
    }
    if (meta.type === "relax") {
      const r = (typeof meta.burn === "number") ? meta.burn : 1.2;
      const eff = r / Math.max(1, multiplier || 1);
      return `-${eff.toFixed(1)}/min`;
    }
    return "0";
  }

  // Mirror Engine fallback so UI can always show something
  function uiMetaFor(act) {
    const s = Engine.getState();
    const metaMap = s.activityMeta || {};
    if (metaMap[act]) return metaMap[act];

    const a = String(act || "").toLowerCase();

    if (
      a.includes("phone") || a.includes("scroll") || a.includes("media") ||
      a.includes("tv") || a.includes("gaming") || a.includes("nap") ||
      a.includes("sleep") || a.includes("idle") || a.includes("bed")
    ) return { type: "relax", burn: 1.2 };

    if (
      a.includes("work") || a.includes("learn") || a.includes("study") ||
      a.includes("clean") || a.includes("laundry") || a.includes("dish") ||
      a.includes("cook") || a.includes("shopping") || a.includes("errand") ||
      a.includes("plan") || a.includes("draw") || a.includes("creative") ||
      a.includes("read") || a.includes("admin") || a.includes("email") ||
      a.includes("exercise") || a.includes("workout")
    ) return { type: "productive", earn: 1.2 };

    return { type: "neutral" };
  }

  function updateSummary() {
    const parts = [];
    if (selected.location) parts.push(selected.location);
    if (selected.movement) parts.push(selected.movement);
    selected.activity.forEach(a => parts.push(a));
    currentStatesEl.textContent = parts.length ? parts.join(" | ") : "None";
  }

  function updateActiveBar() {
    const s = Engine.getState();
    activeBar.innerHTML = "";

    const addBtn = (cat, value) => {
      const btn = document.createElement("button");
      btn.className = `state-btn ${cat}`;

      if (cat === "activity") {
        const meta = uiMetaFor(value);
        btn.textContent = `${value} (${fmtRate(meta, s.multiplier)})`;
      } else {
        btn.textContent = value;
      }

      btn.addEventListener("click", () => {
        if (cat === "activity") selected.activity.delete(value);
        else selected[cat] = null;

        renderOptionActives();
        updateActiveBar();
        updateSummary();
        updateActivityPanelVisibility();
        pushToBrain();
      });

      activeBar.appendChild(btn);
    };

    if (selected.location) addBtn("location", selected.location);
    if (selected.movement) addBtn("movement", selected.movement);
    selected.activity.forEach(v => addBtn("activity", v));
  }

  function renderOptionActives() {
    const cat = categories[categoryIndex];
    [...optTrack.children].forEach(card => {
      const value = card.textContent;
      const on = (cat === "activity") ? selected.activity.has(value) : selected[cat] === value;
      card.classList.toggle("active", on);
    });
  }

  function buildCategories() {
    catTrack.innerHTML = "";
    categories.forEach(cat => {
      const card = document.createElement("div");
      card.className = "card";
      card.textContent = cat.toUpperCase();
      catTrack.appendChild(card);
    });
    snap(catTrack, categoryIndex);
  }

  function loadOptions() {
    optTrack.innerHTML = "";
    const cat = categories[categoryIndex];
    DATA[cat].forEach(opt => {
      const card = document.createElement("div");
      card.className = "card";
      card.textContent = opt;
      optTrack.appendChild(card);
    });

    optionIndex = 0;
    snap(optTrack, optionIndex);
    renderOptionActives();
    updateActivityPanelVisibility();
  }

  function toggleCurrentOption() {
    const cat = categories[categoryIndex];
    const card = optTrack.children[optionIndex];
    if (!card) return;

    const value = card.textContent;

    if (cat === "activity") {
      if (selected.activity.has(value)) selected.activity.delete(value);
      else selected.activity.add(value);
    } else {
      selected[cat] = value;
    }

    renderOptionActives();
    updateActiveBar();
    updateSummary();
    updateActivityPanelVisibility();
    pushToBrain();
  }

  function renderActivityButtons() {
    if (!activityPanel) return;

    const s = Engine.getState();

    activityPanel.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "activity-grid";

    DATA.activity.forEach(name => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "activity-btn";

      const meta = uiMetaFor(name);
      const rate = fmtRate(meta, s.multiplier);

      b.innerHTML = `<span class="ab-name">${name}</span><span class="ab-rate">${rate}</span>`;
      if (selected.activity.has(name)) b.classList.add("active");

      b.addEventListener("click", () => {
        if (selected.activity.has(name)) selected.activity.delete(name);
        else selected.activity.add(name);

        renderActivityButtons();
        renderOptionActives();
        updateActiveBar();
        updateSummary();
        pushToBrain();
      });

      wrap.appendChild(b);
    });

    activityPanel.appendChild(wrap);
  }

  function updateActivityPanelVisibility() {
    if (!activityPanel) return;

    const cat = categories[categoryIndex];
    if (cat === "activity") {
      activityPanel.classList.add("show");
      renderActivityButtons();
    } else {
      activityPanel.classList.remove("show");
    }
  }

  function enableSwipeOnCarousel(carousel, isCategory) {
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let axis = null;

    carousel.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      dragging = true;
      axis = null;

      const track = isCategory ? catTrack : optTrack;
      track.style.transition = "none";
    }, { passive: true });

    carousel.addEventListener("touchmove", (e) => {
      if (!dragging) return;

      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (!axis) axis = (Math.abs(dx) > Math.abs(dy)) ? "x" : "y";
      if (axis !== "x") return;

      e.preventDefault();

      const baseIndex = isCategory ? categoryIndex : optionIndex;
      const track = isCategory ? catTrack : optTrack;

      track.style.transform = `translateX(calc(-${baseIndex * 100}% + ${dx}px))`;
    }, { passive: false });

    carousel.addEventListener("touchend", (e) => {
      if (!dragging) return;
      dragging = false;

      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      const swipeThreshold = 45;
      const tapThreshold = 10;

      if (Math.abs(dx) < tapThreshold && Math.abs(dy) < tapThreshold) {
        if (!isCategory) toggleCurrentOption();
        snap(isCategory ? catTrack : optTrack, isCategory ? categoryIndex : optionIndex);
        return;
      }

      if (!axis) axis = (Math.abs(dx) > Math.abs(dy)) ? "x" : "y";

      if (axis !== "x") {
        snap(isCategory ? catTrack : optTrack, isCategory ? categoryIndex : optionIndex);
        return;
      }

      if (dx < -swipeThreshold) {
        if (isCategory) categoryIndex = clamp(categoryIndex + 1, 0, categories.length - 1);
        else optionIndex = clamp(optionIndex + 1, 0, optTrack.children.length - 1);
      } else if (dx > swipeThreshold) {
        if (isCategory) categoryIndex = clamp(categoryIndex - 1, 0, categories.length - 1);
        else optionIndex = clamp(optionIndex - 1, 0, optTrack.children.length - 1);
      }

      if (isCategory) {
        snap(catTrack, categoryIndex);
        loadOptions();
      } else {
        snap(optTrack, optionIndex);
        renderOptionActives();
        updateActivityPanelVisibility();
      }

      updateSummary();
      updateActiveBar();
    }, { passive: true });
  }

  function hydrateFromBrain() {
    const s = Engine.getState();
    selected.location = s.active.location || null;
    selected.movement = s.active.movement || null;
    selected.activity = new Set(s.active.activity || []);
  }

  function init() {
    hydrateFromBrain();
    buildCategories();
    loadOptions();
    updateSummary();
    updateActiveBar();
    updateActivityPanelVisibility();

    enableSwipeOnCarousel(catCarousel, true);
    enableSwipeOnCarousel(optCarousel, false);

    pushToBrain();
  }

  return { init, renderActivityButtons };
})();