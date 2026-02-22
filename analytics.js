// analytics.js (FULL) - self-healing wizard
// Works even if analytics.html is the old layout.
// It will CREATE the wizard UI if the required elements don't exist.
// Data source: Engine.getState() if present, else localStorage "brain_state_v1"

(() => {
  /* -------------------- helpers -------------------- */
  const $ = (id) => document.getElementById(id);

  function fmtMin(n){
    if (typeof n !== "number" || !isFinite(n)) return "0.0";
    return n.toFixed(1);
  }

  function dayKeyFromMs(ms){
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }

  function todayKey(){ return dayKeyFromMs(Date.now()); }
  function yesterdayKey(){
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dayKeyFromMs(d.getTime());
  }

  function loadBrain(){
    if (typeof Engine !== "undefined" && Engine.getState) return Engine.getState();
    try{
      const raw = localStorage.getItem("brain_state_v1");
      return raw ? JSON.parse(raw) : null;
    }catch{
      return null;
    }
  }

  function sessionsFromBrain(brain){
    if (!brain) return [];
    if (Array.isArray(brain.sessions)) return brain.sessions;
    // fallback: sometimes stored as brain.store.sessions etc
    if (brain.store && Array.isArray(brain.store.sessions)) return brain.store.sessions;
    return [];
  }

  function normSession(raw){
    const a = raw.active || raw.state || raw.activeState || {};
    const startMs = typeof raw.startMs === "number" ? raw.startMs : (typeof raw.start === "number" ? raw.start : null);
    const dayKey = startMs ? dayKeyFromMs(startMs) : "unknown";
    const durMin =
      typeof raw.durationMin === "number" ? raw.durationMin :
      (typeof raw.duration === "number" ? raw.duration : 0);

    const loc = a.location || null;
    const mov = a.movement || null;
    const acts = Array.isArray(a.activity) ? a.activity : (typeof a.activity === "string" ? [a.activity] : []);

    const net =
      raw.delta && typeof raw.delta.net === "number" ? raw.delta.net :
      (typeof raw.net === "number" ? raw.net : 0);

    return { dayKey, startMs, durMin: (durMin || 0), loc, mov, acts, net };
  }

  function groupByDay(rawSessions){
    const by = {};
    for (const s of rawSessions){
      const n = normSession(s);
      if (!by[n.dayKey]) by[n.dayKey] = [];
      by[n.dayKey].push(n);
    }
    return by;
  }

  function aggByKey(sessions, field){
    const t = {};
    for (const s of sessions){
      const k = s[field];
      if (!k) continue;
      t[k] = (t[k] || 0) + (s.durMin || 0);
    }
    return t;
  }

  function aggActivities(sessions){
    const t = {};
    const impact = {};
    for (const s of sessions){
      const acts = s.acts || [];
      const dur = s.durMin || 0;
      const net = s.net || 0;

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

  // average minutes/day across days where the item appears (best for things like "Work")
  function avgPerDay(byDay, aggFn){
    const days = Object.keys(byDay).filter(k => k !== "unknown");
    const totals = {};
    const counts = {};
    for (const dk of days){
      const m = aggFn(byDay[dk]);
      for (const [k,v] of Object.entries(m)){
        totals[k] = (totals[k] || 0) + v;
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    const avg = {};
    for (const k of Object.keys(totals)){
      avg[k] = totals[k] / (counts[k] || 1);
    }
    return { avg, dayCount: days.length };
  }

  function mergeKeys(a,b,c){
    const set = new Set();
    for (const k of Object.keys(a || {})) set.add(k);
    for (const k of Object.keys(b || {})) set.add(k);
    for (const k of Object.keys(c || {})) set.add(k);
    return Array.from(set);
  }

  function signDelta(n){
    if (!isFinite(n)) n = 0;
    return (n >= 0 ? "+" : "-") + fmtMin(Math.abs(n));
  }

  /* -------------------- UI creation (self-healing) -------------------- */
  function ensureWizardUI(){
    // If the wizard exists, use it.
    if ($("wizTitle") && $("wizContent") && $("wizBack") && $("wizNext") && $("wizStepPill")) {
      return {
        title: $("wizTitle"),
        sub: $("wizSub") || null,
        content: $("wizContent"),
        back: $("wizBack"),
        next: $("wizNext"),
        pill: $("wizStepPill")
      };
    }

    // Otherwise, build it inside the page (works with old analytics.html).
    const mount = document.querySelector(".pageWrap") || document.body;

    const wrap = document.createElement("div");
    wrap.style.maxWidth = "820px";
    wrap.style.margin = "0 auto";
    wrap.style.padding = "16px";

    // Back row
    const topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.alignItems = "center";
    topRow.style.gap = "10px";
    topRow.style.marginBottom = "12px";

    const backLink = document.createElement("a");
    backLink.href = "index.html";
    backLink.className = "btn small ghost";
    backLink.textContent = "← Back";

    const pill = document.createElement("div");
    pill.className = "pill";
    pill.innerHTML = "<span>Analytics</span>";

    topRow.appendChild(backLink);
    topRow.appendChild(pill);

    // Wizard shell
    const shell = document.createElement("div");
    shell.style.border = "1px solid rgba(11,18,32,.10)";
    shell.style.borderRadius = "28px";
    shell.style.overflow = "hidden";
    shell.style.background = "rgba(255,255,255,.86)";
    shell.style.boxShadow = "0 18px 44px rgba(11,18,32,.12)";

    const head = document.createElement("div");
    head.style.padding = "16px 16px 12px";
    head.style.borderBottom = "1px solid rgba(11,18,32,.06)";
    head.style.background =
      "radial-gradient(240px 110px at 18% 0%, rgba(110,190,255,.16), transparent 70%)," +
      "radial-gradient(240px 110px at 82% 0%, rgba(255,140,200,.16), transparent 70%)," +
      "rgba(255,255,255,.55)";

    const t = document.createElement("div");
    t.id = "wizTitle";
    t.style.fontWeight = "950";
    t.style.fontSize = "20px";
    t.textContent = "Analytics";

    const s = document.createElement("div");
    s.id = "wizSub";
    s.style.marginTop = "6px";
    s.style.color = "rgba(11,18,32,.62)";
    s.style.fontSize = "13px";
    s.style.lineHeight = "1.4";
    s.textContent = "Loading…";

    head.appendChild(t);
    head.appendChild(s);

    const content = document.createElement("div");
    content.id = "wizContent";
    content.style.padding = "14px 16px";
    content.style.maxHeight = "64vh";
    content.style.overflowY = "auto";
    content.style.webkitOverflowScrolling = "touch";

    const foot = document.createElement("div");
    foot.style.padding = "12px 16px 16px";
    foot.style.borderTop = "1px solid rgba(11,18,32,.06)";
    foot.style.display = "flex";
    foot.style.justifyContent = "space-between";
    foot.style.alignItems = "center";
    foot.style.gap = "10px";

    const backBtn = document.createElement("button");
    backBtn.id = "wizBack";
    backBtn.className = "btn ghost";
    backBtn.type = "button";
    backBtn.textContent = "Back";

    const stepPill = document.createElement("div");
    stepPill.id = "wizStepPill";
    stepPill.style.display = "inline-flex";
    stepPill.style.alignItems = "center";
    stepPill.style.gap = "8px";
    stepPill.style.padding = "8px 10px";
    stepPill.style.borderRadius = "999px";
    stepPill.style.border = "1px solid rgba(11,18,32,.10)";
    stepPill.style.background = "rgba(11,18,32,.04)";
    stepPill.style.fontSize = "12px";
    stepPill.style.color = "rgba(11,18,32,.65)";
    stepPill.style.userSelect = "none";
    stepPill.textContent = "Step 1/1";

    const nextBtn = document.createElement("button");
    nextBtn.id = "wizNext";
    nextBtn.className = "btn";
    nextBtn.type = "button";
    nextBtn.textContent = "Next";

    foot.appendChild(backBtn);
    foot.appendChild(stepPill);
    foot.appendChild(nextBtn);

    shell.appendChild(head);
    shell.appendChild(content);
    shell.appendChild(foot);

    // Clear old content if it exists (pre blocks etc) but keep page usable:
    // If your analytics page already has a container, we just append our wizard above it.
    wrap.appendChild(topRow);
    wrap.appendChild(shell);

    mount.innerHTML = "";
    mount.appendChild(wrap);

    return {
      title: t,
      sub: s,
      content,
      back: backBtn,
      next: nextBtn,
      pill: stepPill
    };
  }

  function el(tag, cls){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function card(title, subtitle){
    const c = el("div");
    c.style.border = "1px solid rgba(11,18,32,.10)";
    c.style.borderRadius = "22px";
    c.style.background = "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.78))";
    c.style.boxShadow = "0 10px 26px rgba(11,18,32,.10)";
    c.style.padding = "14px 14px";

    const h = el("div");
    h.style.fontWeight = "950";
    h.style.fontSize = "14px";
    h.textContent = title;

    const m = el("div");
    m.style.marginTop = "6px";
    m.style.color = "rgba(11,18,32,.62)";
    m.style.fontSize = "12px";
    m.style.lineHeight = "1.35";
    m.textContent = subtitle || "";

    c.appendChild(h);
    if (subtitle) c.appendChild(m);
    return c;
  }

  function tableInto(cardEl, rows){
    const table = el("div");
    table.style.marginTop = "10px";
    table.style.borderTop = "1px solid rgba(11,18,32,.06)";

    const head = el("div");
    head.style.display = "grid";
    head.style.gridTemplateColumns = "1.4fr .7fr .7fr .7fr .7fr .7fr";
    head.style.gap = "8px";
    head.style.padding = "8px 0";
    head.style.borderBottom = "1px solid rgba(11,18,32,.06)";
    head.style.fontSize = "12px";
    head.style.fontWeight = "950";
    head.style.color = "rgba(11,18,32,.75)";
    head.innerHTML = `
      <div>Item</div>
      <div style="text-align:right;">Today</div>
      <div style="text-align:right;">Yday</div>
      <div style="text-align:right;">Avg</div>
      <div style="text-align:right;">T-Avg</div>
      <div style="text-align:right;">T-Y</div>
    `;
    table.appendChild(head);

    if (!rows.length){
      const empty = el("div");
      empty.style.marginTop = "10px";
      empty.style.color = "rgba(11,18,32,.62)";
      empty.style.fontSize = "12px";
      empty.textContent = "No data yet.";
      cardEl.appendChild(empty);
      return;
    }

    for (const r of rows){
      const row = el("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "1.4fr .7fr .7fr .7fr .7fr .7fr";
      row.style.gap = "8px";
      row.style.padding = "8px 0";
      row.style.borderBottom = "1px solid rgba(11,18,32,.06)";
      row.style.fontSize = "12px";
      row.innerHTML = `
        <div>${escapeHtml(r.item)}</div>
        <div style="text-align:right; font-variant-numeric: tabular-nums;">${fmtMin(r.today)}</div>
        <div style="text-align:right; font-variant-numeric: tabular-nums;">${fmtMin(r.yday)}</div>
        <div style="text-align:right; font-variant-numeric: tabular-nums;">${fmtMin(r.avg)}</div>
        <div style="text-align:right; font-variant-numeric: tabular-nums;">${signDelta(r.dAvg)}</div>
        <div style="text-align:right; font-variant-numeric: tabular-nums;">${signDelta(r.dY)}</div>
      `;
      table.appendChild(row);
    }

    cardEl.appendChild(table);
  }

  function escapeHtml(s){
    return String(s ?? "").replace(/[&<>"']/g, (c)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function buildRows(todayMap, ydayMap, avgMap, limit=16){
    const keys = mergeKeys(todayMap, ydayMap, avgMap);
    keys.sort((a,b)=> (todayMap[b]||0) - (todayMap[a]||0));
    const out = [];
    for (const k of keys.slice(0, limit)){
      const t = todayMap[k] || 0;
      const y = ydayMap[k] || 0;
      const a = avgMap[k] || 0;
      out.push({ item:k, today:t, yday:y, avg:a, dAvg:t-a, dY:t-y });
    }
    return out;
  }

  /* -------------------- main -------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const ui = ensureWizardUI();

    const brain = loadBrain();
    const rawSessions = sessionsFromBrain(brain);

    if (!rawSessions.length){
      ui.title.textContent = "Analytics";
      if (ui.sub) ui.sub.textContent = "No data yet. Track on the main page first, then come back.";
      ui.content.innerHTML = "";
      const c = card("No sessions found", "Go use the main tracker for a minute, then reload analytics.");
      ui.content.appendChild(c);
      ui.back.disabled = true;
      ui.next.textContent = "Go to tracker";
      ui.pill.textContent = "Step 1/1";
      ui.next.onclick = () => { window.location.href = "index.html"; };
      return;
    }

    const byDay = groupByDay(rawSessions);
    const tk = todayKey();
    const yk = yesterdayKey();

    const todaySessions = byDay[tk] || [];
    const ydaySessions = byDay[yk] || [];

    const totalToday = todaySessions.reduce((a,s)=>a+(s.durMin||0), 0);
    const totalYday = ydaySessions.reduce((a,s)=>a+(s.durMin||0), 0);
    const dayCount = Object.keys(byDay).filter(k=>k!=="unknown").length;

    // Locations
    const locToday = aggByKey(todaySessions, "loc");
    const locY = aggByKey(ydaySessions, "loc");
    const locAvg = avgPerDay(byDay, (ss)=>aggByKey(ss,"loc")).avg;

    // Movement
    const movToday = aggByKey(todaySessions, "mov");
    const movY = aggByKey(ydaySessions, "mov");
    const movAvg = avgPerDay(byDay, (ss)=>aggByKey(ss,"mov")).avg;

    // Activities
    const actToday = aggActivities(todaySessions).t;
    const actY = aggActivities(ydaySessions).t;
    const actAvg = avgPerDay(byDay, (ss)=>aggActivities(ss).t).avg;

    const steps = [
      {
        name: "Overview",
        sub: "Today and yesterday totals, and how many days you’ve tracked.",
        render: () => {
          const wrap = el("div");
          wrap.style.display = "grid";
          wrap.style.gridTemplateColumns = "1fr";
          wrap.style.gap = "12px";

          const c = card("Totals", `Today (${tk}) vs Yesterday (${yk})`);
          const meta = el("div");
          meta.style.marginTop = "10px";
          meta.style.color = "rgba(11,18,32,.75)";
          meta.style.fontSize = "12px";
          meta.style.lineHeight = "1.45";
          meta.innerHTML = `
            Days tracked: ${dayCount}<br>
            Today minutes: <b>${fmtMin(totalToday)}</b><br>
            Yesterday minutes: <b>${fmtMin(totalYday)}</b>
          `;
          c.appendChild(meta);

          wrap.appendChild(c);

          const c2 = card("Data source", "Where this page is reading from.");
          const src = el("div");
          src.style.marginTop = "10px";
          src.style.color = "rgba(11,18,32,.75)";
          src.style.fontSize = "12px";
          src.innerHTML = `
            ${typeof Engine !== "undefined" && Engine.getState ? "Engine.getState()" : "localStorage: brain_state_v1"}<br>
            Sessions in data: <b>${rawSessions.length}</b>
          `;
          c2.appendChild(src);
          wrap.appendChild(c2);

          return wrap;
        }
      },
      {
        name: "Activities",
        sub: "Minutes per activity: Today vs Yesterday vs your all-time average per day.",
        render: () => {
          const wrap = el("div");
          wrap.style.display = "grid";
          wrap.style.gridTemplateColumns = "1fr";
          wrap.style.gap = "12px";

          const c = card("Activities", "Shared minutes if multiple activities are set in a session.");
          const rows = buildRows(actToday, actY, actAvg, 18);
          tableInto(c, rows);
          wrap.appendChild(c);

          return wrap;
        }
      },
      {
        name: "Locations",
        sub: "Minutes by location: Today vs Yesterday vs average per day.",
        render: () => {
          const wrap = el("div");
          wrap.style.display = "grid";
          wrap.style.gridTemplateColumns = "1fr";
          wrap.style.gap = "12px";

          const c = card("Locations", "Where your time went.");
          const rows = buildRows(locToday, locY, locAvg, 14);
          tableInto(c, rows);
          wrap.appendChild(c);

          return wrap;
        }
      },
      {
        name: "Movement",
        sub: "Minutes by movement: Today vs Yesterday vs average per day.",
        render: () => {
          const wrap = el("div");
          wrap.style.display = "grid";
          wrap.style.gridTemplateColumns = "1fr";
          wrap.style.gap = "12px";

          const c = card("Movement", "How you were moving.");
          const rows = buildRows(movToday, movY, movAvg, 14);
          tableInto(c, rows);
          wrap.appendChild(c);

          return wrap;
        }
      },
      {
        name: "Raw export",
        sub: "If something looks wrong, copy the raw JSON and we’ll inspect it.",
        render: () => {
          const wrap = el("div");
          wrap.style.display = "grid";
          wrap.style.gridTemplateColumns = "1fr";
          wrap.style.gap = "12px";

          const c = card("Raw JSON", "This is your stored state.");
          const pre = el("pre");
          pre.style.whiteSpace = "pre-wrap";
          pre.style.wordBreak = "break-word";
          pre.style.margin = "10px 0 0";
          pre.style.fontSize = "12px";
          pre.textContent = localStorage.getItem("brain_state_v1") || "(No raw brain_state_v1 found)";
          c.appendChild(pre);

          const btnRow = el("div");
          btnRow.style.display = "flex";
          btnRow.style.gap = "10px";
          btnRow.style.marginTop = "12px";

          const copyBtn = el("button");
          copyBtn.className = "btn small ghost";
          copyBtn.type = "button";
          copyBtn.textContent = "Copy raw JSON";
          copyBtn.onclick = async () => {
            const raw = localStorage.getItem("brain_state_v1") || "";
            if(!raw){ alert("No raw JSON found."); return; }
            try{
              await navigator.clipboard.writeText(raw);
              alert("Copied.");
            }catch{
              alert("Could not auto-copy on this browser. Long-press and copy manually.");
            }
          };

          const doneBtn = el("button");
          doneBtn.className = "btn small ghost";
          doneBtn.type = "button";
          doneBtn.textContent = "Back to tracker";
          doneBtn.onclick = () => window.location.href = "index.html";

          btnRow.appendChild(copyBtn);
          btnRow.appendChild(doneBtn);

          c.appendChild(btnRow);

          wrap.appendChild(c);
          return wrap;
        }
      }
    ];

    let idx = 0;

    function paint(){
      ui.title.textContent = steps[idx].name;
      if (ui.sub) ui.sub.textContent = steps[idx].sub;

      ui.content.innerHTML = "";
      ui.content.appendChild(steps[idx].render());

      ui.pill.textContent = `Step ${idx + 1}/${steps.length}`;
      ui.back.disabled = idx === 0;
      ui.next.textContent = (idx === steps.length - 1) ? "Done" : "Next";
    }

    ui.back.onclick = () => {
      idx = Math.max(0, idx - 1);
      paint();
    };

    ui.next.onclick = () => {
      if (idx === steps.length - 1){
        window.location.href = "index.html";
        return;
      }
      idx = Math.min(steps.length - 1, idx + 1);
      paint();
    };

    paint();
  });
})();
