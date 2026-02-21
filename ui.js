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

  // ===== Activity sections (NEW) =====
  const ACTIVITY_SECTIONS = [
    {
      title: "Work",
      items: [
        "Focused Work","Deep Work","Emails/Admin","Meetings","Calls (Work)","Planning","Budgeting",
        "Job Search","Client Work","Paperwork","Scheduling"
      ]
    },
    {
      title: "Learning",
      items: [
        "Learning","Studying","Reading (Learning)","Research","Notes","Practice Drills",
        "Tutorials","Coding","Drawing Study","Language Practice"
      ]
    },
    {
      title: "Chores",
      items: [
        "Cleaning","Laundry","Dishes","Cooking","Meal Prep","Groceries","Shopping","Errands",
        "Organizing","Decluttering","Trash","Pets","Car Cleanup","Yard Work"
      ]
    },
    {
      title: "Health",
      items: [
        "Workout","Cardio","Weights","Stretching","Walk (Exercise)","Meditation","Breathwork",
        "Doctor/Appointment","Therapy","Hygiene","Shower/Get Ready","Skincare","Nap","Sleeping"
      ]
    },
    {
      title: "Social",
      items: [
        "Conversation","Socializing","Hanging Out","Family Time","Dating","Event/Outing",
        "Phone Call (Personal)","Texting","Community"
      ]
    },
    {
      title: "Entertainment",
      items: [
        "Phone","Scrolling","Media","TV","Gaming","Music","Podcast","YouTube","Movies",
        "TikTok","Reddit","Streaming","Idle"
      ]
    },
    {
      title: "Food",
      items: [
        "Eating","Cooking (Enjoyment)","Coffee","Restaurant","Snack","Hydrating"
      ]
    },
    {
      title: "Other",
      items: [
        "Waiting","Commuting","Driving","Passenger","Travel","Misc"
      ]
    }
  ];

  // For the swipe UI categories
  const categories = ["location","movement","activity"];

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

  function updateSummary() {
    const parts = [];
    if (selected.location) parts.push(selected.location);
    if (selected.movement) parts.push(selected.movement);
    selected.activity.forEach(a => parts.push(a));
    currentStatesEl.textContent = parts.length ? parts.join(" | ") : "None";
  }

  // Show rate label using Engine meta if present, otherwise keyword fallback guess
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

    // For activity, the swipe options are just a short “hint list”
    const list = (cat === "activity")
      ? ["Tap buttons below", "Select multiple", "Use Active Bar to remove"]
      : DATA[cat];

    list.forEach(opt => {
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

    // For activity, we don’t toggle via swipe cards anymore
    if (cat === "activity") return;

    const card = optTrack.children[optionIndex];
    if (!card) return;

    const value = card.textContent;
    selected[cat] = value;

    renderOptionActives();
    updateActiveBar();
    updateSummary();
    pushToBrain();
  }

  function renderActivityButtons() {
    if (!activityPanel) return;

    activityPanel.innerHTML = "";

    ACTIVITY_SECTIONS.forEach(section => {
      const header = document.createElement("div");
      header.style.fontWeight = "900";
      header.style.color = "var(--muted)";
      header.style.margin = "10px 0 8px";
      header.style.fontSize = "12px";
      header.textContent = section.title.toUpperCase();
      activityPanel.appendChild(header);

      const wrap = document.createElement("div");
      wrap.className = "activity-grid";

      section.items.forEach(name => {
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

          renderActivityButtons();
          updateActiveBar();
          updateSummary();
          pushToBrain();
        });

        wrap.appendChild(b);
      });

      activityPanel.appendChild(wrap);
    });
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

  return { init };
})();