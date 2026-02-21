(() => {
  function fmtMin(n){
    if (typeof n !== "number" || !isFinite(n)) return "0.0";
    return n.toFixed(1);
  }

  function fmtMoney(n){
    if (typeof n !== "number" || !isFinite(n)) n = 0;
    const sign = n >= 0 ? "+" : "-";
    return sign + "$" + Math.abs(n).toFixed(2);
  }

  function loadBrain(){
    // Prefer Engine if available, because it ticks and stays current
    if (typeof Engine !== "undefined" && Engine.getState) return Engine.getState();

    try {
      const raw = localStorage.getItem("brain_state_v1");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function entries(obj){
    return Object.entries(obj).sort((a,b)=>b[1]-a[1]);
  }

  function aggByKey(sessions, key){
    const t = {};
    for (const s of sessions){
      const dur = (typeof s.durationMin === "number") ? s.durationMin : 0;
      const a = s.active || {};
      const v = a[key];
      if (!v) continue;
      t[v] = (t[v] || 0) + dur;
    }
    return t;
  }

  function aggActivities(sessions){
    const t = {};
    const impact = {};
    for (const s of sessions){
      const dur = (typeof s.durationMin === "number") ? s.durationMin : 0;
      const a = s.active || {};
      const acts = Array.isArray(a.activity) ? a.activity : [];
      const net = (s.delta && typeof s.delta.net === "number") ? s.delta.net : 0;

      if (acts.length){
        const shareMin = dur / acts.length;
        const shareNet = net / acts.length;
        for (const act of acts){
          t[act] = (t[act] || 0) + shareMin;
          impact[act] = (impact[act] || 0) + shareNet;
        }
      } else {
        t["(No Activity)"] = (t["(No Activity)"] || 0) + dur;
        impact["(No Activity)"] = (impact["(No Activity)"] || 0) + net;
      }
    }
    return { t, impact };
  }

  function barText(mapObj, limit=10){
    const e = entries(mapObj).slice(0, limit);
    if (!e.length) return "No data yet.";
    return e.map(([name, mins]) => `${name} — ${fmtMin(mins)} min`).join("\n");
  }

  function stepOverview(brain, sessions){
    if (!brain) return "No data found yet.\n\nGo track for a minute on the main page and come back.";
    return [
      "===== OVERVIEW =====",
      `Balance: $${(brain.balance || 0).toFixed(2)}`,
      `Multiplier: ${(brain.multiplier || 1).toFixed(2)}x`,
      `Streak: ${brain.streak || 0}`,
      "",
      `Day: ${brain.dayKey || "None"}`,
      `Productive mins: ${fmtMin(brain.productiveMins || 0)}`,
      `Relax mins: ${fmtMin(brain.relaxMins || 0)}`,
      "",
      `Sessions logged: ${sessions.length}`
    ].join("\n");
  }

  function stepTopActivities(sessions){
    if (!sessions.length) return "No sessions yet.";
    const { t, impact } = aggActivities(sessions);
    const top = entries(t).slice(0, 12);
    return [
      "===== TOP ACTIVITIES =====",
      ...top.map(([name, mins]) => {
        const net = impact[name] || 0;
        return `${name} — ${fmtMin(mins)} min | ${fmtMoney(net)}`;
      })
    ].join("\n");
  }

  function stepLocations(sessions){
    if (!sessions.length) return "No sessions yet.";
    return "===== LOCATIONS =====\n" + barText(aggByKey(sessions, "location"), 12);
  }

  function stepMovements(sessions){
    if (!sessions.length) return "No sessions yet.";
    return "===== MOVEMENT =====\n" + barText(aggByKey(sessions, "movement"), 12);
  }

  function stepRecent(sessions){
    if (!sessions.length) return "No sessions yet.";
    const recent = sessions.slice(-25).reverse().map(s => {
      const start = s.startMs ? new Date(s.startMs).toLocaleString() : "unknown";
      const dur = (s.durationMin || 0).toFixed(2);
      const a = s.active || {};
      const loc = a.location || "None";
      const mov = a.movement || "None";
      const act = Array.isArray(a.activity) && a.activity.length ? a.activity.join(", ") : "None";
      const net = (s.delta && typeof s.delta.net === "number") ? s.delta.net : 0;
      return `${loc} | ${mov}\n${act}\n${dur} min | ${fmtMoney(net)}\n${start}\n`;
    }).join("\n");
    return "===== RECENT SESSIONS =====\n\n" + recent;
  }

  function stepExport(){
    const raw = localStorage.getItem("brain_state_v1") || "";
    return "===== EXPORT (RAW JSON) =====\n\n" + raw;
  }

  async function copyRawToClipboard(){
    const raw = localStorage.getItem("brain_state_v1") || "";
    if (!raw) return false;

    try {
      await navigator.clipboard.writeText(raw);
      return true;
    } catch {
      // fallback: try selecting a temporary textarea (older Safari)
      try {
        const ta = document.createElement("textarea");
        ta.value = raw;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const stepCounter = document.getElementById("sessionCount");
    const pre = document.getElementById("recentSessions");
    if (!stepCounter || !pre) return;

    // Inject controls into the same box
    const box = pre.parentElement;

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "10px";
    controls.style.marginTop = "12px";

    const backBtn = document.createElement("button");
    backBtn.textContent = "Back";
    backBtn.className = "menu-link-btn";
    backBtn.type = "button";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.className = "menu-link-btn";
    nextBtn.type = "button";
    nextBtn.style.background = "var(--blue)";
    nextBtn.style.color = "white";
    nextBtn.style.borderColor = "transparent";
    nextBtn.style.fontWeight = "900";

    controls.appendChild(backBtn);
    controls.appendChild(nextBtn);
    box.appendChild(controls);

    const brain = loadBrain();
    const sessions = brain && Array.isArray(brain.sessions) ? brain.sessions : [];

    const steps = [
      { name: "Overview", render: () => stepOverview(brain, sessions) },
      { name: "Top Activities", render: () => stepTopActivities(sessions) },
      { name: "Locations", render: () => stepLocations(sessions) },
      { name: "Movement", render: () => stepMovements(sessions) },
      { name: "Recent", render: () => stepRecent(sessions) },
      { name: "Export", render: () => stepExport() }
    ];

    let idx = 0;

    function paint(){
      stepCounter.textContent = `Step ${idx+1} / ${steps.length}`;
      pre.textContent = steps[idx].render();

      backBtn.disabled = idx === 0;
      nextBtn.textContent = (idx === steps.length - 1) ? "Done (Copy)" : "Next";
    }

    backBtn.addEventListener("click", () => {
      idx = Math.max(0, idx - 1);
      paint();
    });

    nextBtn.addEventListener("click", async () => {
      if (idx === steps.length - 1) {
        const ok = await copyRawToClipboard();
        // Keep it low-key but clear
        if (!ok) alert("Couldn’t auto-copy. Open the Export step and copy manually.");
        window.location.href = "index.html";
        return;
      }
      idx = Math.min(steps.length - 1, idx + 1);
      paint();
    });

    paint();
  });
})();