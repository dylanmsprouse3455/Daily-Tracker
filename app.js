// ===== DATA (layout demo only) =====
const OPTIONS = {
  location: ["Home", "Work", "Car", "Out"],
  movement: ["Stationary", "Walking", "Driving", "Passenger"],
  activity: ["Phone", "Focused Work", "Media", "Conversation", "Exercise", "Idle"]
};

const indexState = {
  location: 0,
  movement: 0,
  activity: 0
};

const selected = {
  location: null,           // single
  movement: null,           // single
  activity: new Set()       // multi
};

// ===== UI ELEMENTS =====
const elLocation = () => document.getElementById("locationValue");
const elMovement = () => document.getElementById("movementValue");
const elActivity = () => document.getElementById("activityValue");
const elCurrentText = () => document.getElementById("currentStatesText");
const elChips = () => document.getElementById("chips");

// ===== HELPERS =====
function wrapIndex(cat, next) {
  const len = OPTIONS[cat].length;
  if (next < 0) return len - 1;
  if (next >= len) return 0;
  return next;
}

function getCurrentOption(cat) {
  return OPTIONS[cat][indexState[cat]];
}

function renderCarouselValues() {
  elLocation().textContent = getCurrentOption("location");
  elMovement().textContent = getCurrentOption("movement");
  elActivity().textContent = getCurrentOption("activity");
}

function renderSelected() {
  const parts = [];

  if (selected.location) parts.push(selected.location);
  if (selected.movement) parts.push(selected.movement);
  if (selected.activity.size) parts.push(...Array.from(selected.activity));

  elCurrentText().textContent = parts.length ? parts.join(" • ") : "None selected";

  // chips
  elChips().innerHTML = "";
  parts.forEach(p => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = p;
    elChips().appendChild(chip);
  });
}

function selectCurrent(cat) {
  const value = getCurrentOption(cat);

  if (cat === "location") {
    selected.location = value; // single
  }

  if (cat === "movement") {
    selected.movement = value; // single
  }

  if (cat === "activity") {
    // multi toggle
    if (selected.activity.has(value)) selected.activity.delete(value);
    else selected.activity.add(value);
  }

  renderSelected();
}

function clearActivities() {
  selected.activity.clear();
  renderSelected();
}

// ===== ACCORDION =====
function setupAccordion() {
  document.querySelectorAll(".acc-item").forEach(item => {
    const header = item.querySelector(".acc-header");
    header.addEventListener("click", () => {
      // only one open at a time (clean). If you want multiple open, remove this block.
      document.querySelectorAll(".acc-item").forEach(other => {
        if (other !== item) other.classList.remove("open");
      });
      item.classList.toggle("open");
    });
  });
}

// ===== ARROWS =====
function setupArrows() {
  document.querySelectorAll(".arrow").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      const dir = Number(btn.dataset.dir);
      indexState[cat] = wrapIndex(cat, indexState[cat] + dir);
      renderCarouselValues();
    });
  });
}

// ===== SWIPE =====
function setupSwipe() {
  document.querySelectorAll(".swipe-card").forEach(card => {
    const cat = card.querySelector(".arrow").dataset.cat;

    let startX = 0;
    let active = false;

    card.addEventListener("touchstart", (e) => {
      active = true;
      startX = e.touches[0].clientX;
    }, { passive: true });

    card.addEventListener("touchmove", (e) => {
      if (!active) return;
      // we are not dragging UI, just detecting
    }, { passive: true });

    card.addEventListener("touchend", (e) => {
      if (!active) return;
      active = false;

      const endX = (e.changedTouches && e.changedTouches[0])
        ? e.changedTouches[0].clientX
        : startX;

      const delta = endX - startX;

      // swipe threshold
      if (Math.abs(delta) < 40) return;

      if (delta < 0) {
        indexState[cat] = wrapIndex(cat, indexState[cat] + 1);
      } else {
        indexState[cat] = wrapIndex(cat, indexState[cat] - 1);
      }

      renderCarouselValues();
    });
  });
}

// ===== SELECT BUTTONS =====
function setupSelectButtons() {
  document.querySelectorAll("[data-select]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.select;
      selectCurrent(cat);
    });
  });

  const clearBtn = document.getElementById("clearActivity");
  if (clearBtn) clearBtn.addEventListener("click", clearActivities);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  setupAccordion();
  setupArrows();
  setupSwipe();
  setupSelectButtons();

  renderCarouselValues();
  renderSelected();

  // start with Location open (feels guided without being a wizard)
  const first = document.querySelector('[data-acc="location"]');
  if (first) first.classList.add("open");
});