const UI = (() => {
  const DATA = {
    location: [
      "Home","Work","Car","Out",
      "Front Room","Bedroom","Kitchen","Bathroom","Porch","Yard","Garage","Office",
      "Store","Restaurant","Gym","Friend House","Family House","Other"
    ],
    movement: [
      "Stationary","Walking","Driving","Passenger","Running","Cycling","Transit"
    ]
  };

  const ACTIVITY_SECTIONS = [
    { title: "Work", items: ["Focused Work","Deep Work","Emails/Admin","Meetings","Calls (Work)","Planning","Budgeting","Paperwork","Scheduling"] },
    { title: "Learning", items: ["Learning","Studying","Reading (Learning)","Research","Notes","Practice Drills","Tutorials","Coding","Drawing Study","Language Practice"] },
    { title: "Chores", items: ["Cleaning","Laundry","Dishes","Cooking","Meal Prep","Groceries","Shopping","Errands","Organizing","Decluttering","Trash","Pets","Car Cleanup","Yard Work"] },
    { title: "Health", items: ["Workout","Cardio","Weights","Stretching","Walk (Exercise)","Meditation","Breathwork","Hygiene","Shower/Get Ready","Skincare","Nap","Sleeping"] },
    { title: "Social", items: ["Conversation","Socializing","Hanging Out","Family Time","Dating","Event/Outing","Phone Call (Personal)","Texting"] },
    { title: "Entertainment", items: ["Phone","Scrolling","Media","TV","Gaming","Music","Podcast","YouTube","Movies","TikTok","Reddit","Streaming","Idle"] },
    { title: "Other", items: ["Eating","Waiting","Commuting","Driving","Passenger","Travel","Misc"] }
  ];

  const categories = ["location","movement","activity"];

  let selected = {
    location: null,
    movement: null,
    activity: new Set()
  };

  let categoryIndex = 0;

  const catCarousel = document.getElementById("categoryCarousel");
  const optCarousel = document.getElementById("optionCarousel");
  const catTrack = document.getElementById("categoryTrack");
  const optTrack = document.getElementById("optionTrack");
  const activeBar = document.getElementById("activeBar");
  const currentStatesEl = document.getElementById("currentStates");
  const activityPanel = document.getElementById("activityPanel");

  // We will re-use activityPanel for ALL categories (location/movement/activity).
  // It becomes a “selection panel” that changes depending on the selected category.

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

  function updateSummary() {
    const parts = [];
    if (selected.location) parts.push(selected.location);
    if (selected.movement) parts.push(selected.movement);
    selected.activity.forEach(a => parts.push(a));
    currentStatesEl.textContent = parts.length ? parts.join(" | ") : "None";
  }

  function metaForLabel(name) {
    const s = Engine.getState();
    const meta = (s.activityMeta && s.activityMeta[name]) ? s.activityMeta[name] : null;
    if (meta) return meta;

    const a = name.toLowerCase();
    if (
      a.includes("phone") || a.includes("scroll") || a.includes("media") || a.includes("tv") ||
      a.includes("gaming") || a.includes("nap") || a.includes("sleep") || a.includes("idle") ||
      a.includes("tiktok") || a.includes("youtube") || a.includes("reddit") || a.includes("movie")
    ) return { type:"relax", burn: 1.2 };

    if (
      a.includes("work") || a.includes("learn") || a.includes("study") || a.includes("clean") ||
      a.includes("laundry") || a.includes("dish") || a.includes("cook") || a.includes("groc") ||
      a.includes("errand") || a.includes("plan") || a.includes("budget") || a.includes("code") ||
      a.includes("draw") || a.includes("practice") || a.includes("exercise") || a.includes("workout") ||
      a.includes("cardio") || a.includes("weights")
    ) return { type:"productive", earn: 1.2 };

    return { type:"neutral" };
  }

  function rateText(meta) {
    if (!meta || meta.type === "neutral") return "0/m";
    if (meta.type === "productive") return `+${(meta.earn ?? 1.2).toFixed(1)}/m`;
    return `-${(meta.burn ?? 1.2).toFixed(1)}/m`;
  }

  function updateActiveBar() {
    activeBar.innerHTML = "";

    const addBtn = (cat, value) => {
      const btn = document.createElement("button");
      btn.className = `state-btn ${cat}`;
      btn.textContent = value;

      btn.addEventListener("click", () => {
        if (cat === "activity") selected.activity.delete(value);
        else selected[cat] = null;

        updateActiveBar();
        updateSummary();
        renderSelectionPanel();
        pushToBrain();
      });

      activeBar.appendChild(btn);
    };

    if (selected.location) addBtn("location", selected.location);
    if (selected.movement) addBtn("movement", selected.movement);
    selected.activity.forEach(v => addBtn("activity", v));
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

  function buildOptionHint() {
    optTrack.innerHTML = "";
    const cat = categories[categoryIndex];
    const hints =
      cat === "location" ? ["Tap below to set location (single)"] :
      cat === "movement" ? ["Tap below to set movement (single)"] :
      ["Tap below to toggle activities (multi)"];

    hints.forEach(h => {
      const card = document.createElement("div");
      card.className = "card";
      card.textContent = h;
      optTrack.appendChild(card);
    });

    snap(optTrack, 0);
  }

  function clearPanel() {
    if (!activityPanel) return;
    activityPanel.innerHTML = "";
  }

  // ===== MAIN: render a panel for whichever category is active =====
  function renderSelectionPanel() {
    if (!activityPanel) return;

    clearPanel();
    activityPanel.classList.add("show");

    const cat = categories[categoryIndex];

    // Helper to create section header (uses your divider CSS if you added it)
    function addSectionHeader(title, cls) {
      const sectionWrap = document.createElement("div");
      sectionWrap.className = "activity-section";

      const header = document.createElement("div");
      header.className = "activity-section-title";

      const pill = document.createElement("div");
      pill.className = "pill " + cls;
      pill.textContent = title;

      const line = document.createElement("div");
      line.className = "line";

      header.appendChild(pill);
      header.appendChild(line);
      sectionWrap.appendChild(header);

      activityPanel.appendChild(sectionWrap);
      return sectionWrap;
    }

    // Helper button grid
    function makeGrid() {
      const grid = document.createElement("div");
      grid.className = "activity-grid";
      return grid;
    }

    // Single-select panel builder
    function singleSelectList(list, key, sectionTitle, cls) {
      const section = addSectionHeader(sectionTitle, cls);
      const grid = makeGrid();

      list.forEach(name => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "activity-btn";
        b.textContent = name;

        const isOn = selected[key] === name;
        if (isOn) b.classList.add("active");

        b.addEventListener("click", () => {
          selected[key] = (selected[key] === name) ? null : name;
          renderSelectionPanel();
          updateActiveBar();
          updateSummary();
          pushToBrain();
        });

        grid.appendChild(b);
      });

      section.appendChild(grid);
    }

    // Multi-select activity section builder
    function activitySections() {
      ACTIVITY_SECTIONS.forEach(sec => {
        const cls = sec.title.toLowerCase().replace(/\s+/g, "");
        const section = addSectionHeader(sec.title, cls);

        const grid = makeGrid();

        sec.items.forEach(name => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "activity-btn";
          b.textContent = name;

          if (selected.activity.has(name)) b.classList.add("active");

          const meta = metaForLabel(name);
          const pill = document.createElement("span");
          pill.className = "rate-pill";

          if (meta.type === "productive") {
            pill.classList.add("pos");
            pill.textContent = rateText(meta);
          } else if (meta.type === "relax") {
            pill.classList.add("neg");
            pill.textContent = rateText(meta);
          } else {
            pill.textContent = "0/m";
          }

          b.appendChild(pill);

          b.addEventListener("click", () => {
            if (selected.activity.has(name)) selected.activity.delete(name);
            else selected.activity.add(name);

            renderSelectionPanel();
            updateActiveBar();
            updateSummary();
            pushToBrain();
          });

          grid.appendChild(b);
        });

        section.appendChild(grid);
      });
    }

    if (cat === "location") {
      singleSelectList(DATA.location, "location", "Location", "work"); // color class re-used
    } else if (cat === "movement") {
      singleSelectList(DATA.movement, "movement", "Movement", "learning");
    } else {
      activitySections();
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

      const baseIndex = isCategory ? categoryIndex : 0;
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
        snap(isCategory ? catTrack : optTrack, isCategory ? categoryIndex : 0);
        return;
      }

      if (!axis) axis = (Math.abs(dx) > Math.abs(dy)) ? "x" : "y";
      if (axis !== "x") {
        snap(isCategory ? catTrack : optTrack, isCategory ? categoryIndex : 0);
        return;
      }

      if (!isCategory) {
        snap(optTrack, 0);
        return;
      }

      if (dx < -swipeThreshold) categoryIndex = clamp(categoryIndex + 1, 0, categories.length - 1);
      else if (dx > swipeThreshold) categoryIndex = clamp(categoryIndex - 1, 0, categories.length - 1);

      snap(catTrack, categoryIndex);
      buildOptionHint();
      renderSelectionPanel();
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
    buildOptionHint();
    updateSummary();
    updateActiveBar();
    renderSelectionPanel();

    enableSwipeOnCarousel(catCarousel, true);
    enableSwipeOnCarousel(optCarousel, false);

    pushToBrain();
  }

  return { init };
})();