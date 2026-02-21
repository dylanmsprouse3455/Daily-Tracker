(() => {
  function el(id) {
    return document.getElementById(id);
  }

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  function loadBrain() {
    const raw = localStorage.getItem("brain_state_v1");
    return raw ? safeParse(raw) : null;
  }

  function fmtMin(n) {
    if (typeof n !== "number" || !isFinite(n)) return "0.0";
    return n.toFixed(1);
  }

  function fmtMoney(n) {
    if (typeof n !== "number" || !isFinite(n)) n = 0;
    const sign = n >= 0 ? "+" : "-";
    return sign + "$" + Math.abs(n).toFixed(2);
  }

  function toEntries(obj) {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]);
  }

  function aggByKey(sessions, key) {
    const totals = {};
    for (const s of sessions) {
      const dur = (typeof s.durationMin === "number") ? s.durationMin : 0;
      const a = s.active || {};
      const v = a[key];
      if (!v) continue;
      totals[v] = (totals[v] || 0) + dur;
    }
    return totals;
  }

  function aggActivities(sessions) {
    const totals = {};
    const impact = {};
    for (const s of sessions) {
      const dur = (typeof s.durationMin === "number") ? s.durationMin : 0;
      const a = s.active || {};
      const acts = Array.isArray(a.activity) ? a.activity : [];
      const net = (s.delta && typeof s.delta.net === "number") ? s.delta.net : 0;

      if (acts.length) {
        const shareMin = dur / acts.length;
        const shareNet = net / acts.length;
        for (const act of acts) {
          totals[act] = (totals[act] || 0) + shareMin;
          impact[act] = (impact[act] || 0) + shareNet;
        }
      } else {
        totals["(No Activity)"] = (totals["(No Activity)"] || 0) + dur;
        impact["(No Activity)"] = (impact["(No Activity)"] || 0) + net;
      }
    }
    return { totals, impact };
  }

  function renderBars(title, entries) {
    const max = entries.length ? entries[0][1] : 0;
    const html = entries.map(([name, val]) => {
      const pct = max ? Math.round((val / max) * 100) : 0;
      return `
        <div class="baritem">
          <div class="barhead">
            <div>${name}</div>
            <div>${fmtMin(val)}m</div>
          </div>
          <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join("");

    return `
      <div class="wiz-kicker">${title}</div>
      <div class="barwrap">${html || `<div class="wiz-p">No data yet.</div>`}</div>
    `;
  }

  function showError(err) {
    const stepEl = el("wizardStep");
    if (!stepEl) return;
    stepEl.innerHTML = `
      <div class="wiz-kicker">Analytics Wizard Error</div>
      <div class="wiz-h">JS crashed</div>
      <p class="wiz-p" style="margin-bottom:10px;">
        This page is loading, but analytics.js threw an error.
      </p>
      <pre>${String(err && err.stack ? err.stack : err)}</pre>
      <p class="wiz-p" style="margin-top:10px;">
        If you see this, send me the screenshot of this error box.
      </p>
    `;
  }

  function initWizard() {
    const stepEl = el("wizardStep");
    const dotsEl = el("dots");
    const backBtn = el("backBtn");
    const nextBtn = el("nextBtn");

    if (!stepEl || !dotsEl || !backBtn || !nextBtn) {
      throw new Error("Missing wizard HTML IDs. Need wizardStep, dots, backBtn, nextBtn.");
    }

    const brain = loadBrain();
    const sessions = brain && Array.isArray(brain.sessions) ? brain.sessions : [];

    const steps = [];

    // 1) Overview
    steps.push(() => {
      if (!brain) {
        return `
          <div class="wiz-kicker">Step 1 of 7</div>
          <div class="wiz-h">No saved data yet</div>
          <p class="wiz-p">Go track for a minute on the main page, then come back.</p>
        `;
      }
      return `
        <div class="wiz-kicker">Step 1 of 7</div>
        <div class="wiz-h">Overview</div>
        <p class="wiz-p">High level snapshot.</p>
        <div class="wiz-grid">
          <div class="mini"><div class="v">${sessions.length}</div><div class="l">Sessions</div></div>
          <div class="mini"><div class="v">$${(brain.balance || 0).toFixed(2)}</div><div class="l">Balance</div></div>
          <div class="mini"><div class="v">${(brain.multiplier || 1).toFixed(2)}x</div><div class="l">Multiplier</div></div>
          <div class="mini"><div class="v">${brain.streak || 0}</div><div class="l">Streak</div></div>
        </div>
      `;
    });

    // 2) Today totals
    steps.push(() => {
      if (!brain) return `<div class="wiz-h">No data</div>`;
      return `
        <div class="wiz-kicker">Step 2 of 7</div>
        <div class="wiz-h">Today totals</div>
        <div class="wiz-grid">
          <div class="mini"><div class="v">${fmtMin(brain.productiveMins || 0)}</div><div class="l">Productive mins</div></div>
          <div class="mini"><div class="v">${fmtMin(brain.relaxMins || 0)}</div><div class="l">Relax mins</div></div>
          <div class="mini"><div class="v">${brain.dayKey || "None"}</div><div class="l">Day</div></div>
          <div class="mini"><div class="v">${(brain.multiplier || 1).toFixed(2)}x</div><div class="l">Multiplier</div></div>
        </div>
      `;
    });

    // 3) Top activities
    steps.push(() => {
      if (!sessions.length) {
        return `
          <div class="wiz-kicker">Step 3 of 7</div>
          <div class="wiz-h">Top activities</div>
          <p class="wiz-p">No sessions yet.</p>
        `;
      }

      const { totals, impact } = aggActivities(sessions);
      const top = toEntries(totals).slice(0, 10);

      const rows = top.map(([name, mins]) => {
        const net = impact[name] || 0;
        return `<div class="row"><div class="left">${name}</div><div class="right">${fmtMin(mins)}m | ${fmtMoney(net)}</div></div>`;
      }).join("");

      return `
        <div class="wiz-kicker">Step 3 of 7</div>
        <div class="wiz-h">Top activities</div>
        <p class="wiz-p">Time + estimated points impact.</p>
        <div class="list">${rows}</div>
      `;
    });

    // 4) Locations
    steps.push(() => {
      if (!sessions.length) return `<div class="wiz-kicker">Step 4 of 7</div><div class="wiz-h">Locations</div><p class="wiz-p">No sessions yet.</p>`;
      const entries = toEntries(aggByKey(sessions, "location")).slice(0, 12);
      return `
        <div class="wiz-kicker">Step 4 of 7</div>
        <div class="wiz-h">Locations</div>
        ${renderBars("Minutes by location", entries)}
      `;
    });

    // 5) Movement
    steps.push(() => {
      if (!sessions.length) return `<div class="wiz-kicker">Step 5 of 7</div><div class="wiz-h">Movement</div><p class="wiz-p">No sessions yet.</p>`;
      const entries = toEntries(aggByKey(sessions, "movement")).slice(0, 12);
      return `
        <div class="wiz-kicker">Step 5 of 7</div>
        <div class="wiz-h">Movement</div>
        ${renderBars("Minutes by movement", entries)}
      `;
    });

    // 6) Recent sessions
    steps.push(() => {
      if (!sessions.length) return `<div class="wiz-kicker">Step 6 of 7</div><div class="wiz-h">Recent sessions</div><p class="wiz-p">No sessions yet.</p>`;
      const recent = sessions.slice(-20).reverse().map(s => {
        const start = s.startMs ? new Date(s.startMs).toLocaleString() : "unknown";
        const dur = (s.durationMin || 0).toFixed(2);
        const a = s.active || {};
        const loc = a.location || "None";
        const mov = a.movement || "None";
        const act = Array.isArray(a.activity) && a.activity.length ? a.activity.join(", ") : "None";
        const net = (s.delta && typeof s.delta.net === "number") ? s.delta.net : 0;
        return `<div class="row"><div class="left">${loc} | ${mov}<div class="wiz-p" style="margin-top:4px;">${act}</div></div><div class="right">${dur}m<br>${fmtMoney(net)}<br><span class="small">${start}</span></div></div>`;
      }).join("");

      return `
        <div class="wiz-kicker">Step 6 of 7</div>
        <div class="wiz-h">Recent sessions</div>
        <div class="list">${recent}</div>
      `;
    });

    // 7) Export
    steps.push(() => {
      const raw = localStorage.getItem("brain_state_v1") || "";
      return `
        <div class="wiz-kicker">Step 7 of 7</div>
        <div class="wiz-h">Export</div>
        <p class="wiz-p">Copy raw JSON.</p>
        <button class="btn primary" id="copyBtn" type="button">Copy JSON</button>
        <pre id="raw">${raw}</pre>
      `;
    });

    let step = 0;

    function paintDots() {
      dotsEl.innerHTML = "";
      for (let i = 0; i < steps.length; i++) {
        const d = document.createElement("div");
        d.className = "dot" + (i === step ? " on" : "");
        dotsEl.appendChild(d);
      }
    }

    function paint() {
      stepEl.innerHTML = steps[step]();
      paintDots();

      backBtn.disabled = (step === 0);
      nextBtn.textContent = (step === steps.length - 1) ? "Done" : "Next";

      const copyBtn = el("copyBtn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const raw = el("raw")?.textContent || "";
          navigator.clipboard.writeText(raw).then(() => alert("Copied.")).catch(() => alert("Copy failed."));
        });
      }
    }

    backBtn.addEventListener("click", () => {
      step = Math.max(0, step - 1);
      paint();
    });

    nextBtn.addEventListener("click", () => {
      if (step === steps.length - 1) {
        window.location.href = "index.html";
        return;
      }
      step = Math.min(steps.length - 1, step + 1);
      paint();
    });

    paint();
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      initWizard();
    } catch (err) {
      showError(err);
    }
  });
})();