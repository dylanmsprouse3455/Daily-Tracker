// analytics.js (FULL) - wizard analytics: Today vs Avg, Yesterday vs Avg, plus breakdowns
(() => {
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
    try {
      const raw = localStorage.getItem("brain_state_v1");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function sessionsFromBrain(brain){
    if (!brain) return [];
    return Array.isArray(brain.sessions) ? brain.sessions : [];
  }

  function normSession(s){
    const a = s.active || {};
    const startMs = typeof s.startMs === "number" ? s.startMs : null;
    const dayKey = startMs ? dayKeyFromMs(startMs) : "unknown";
    const durMin = typeof s.durationMin === "number" ? s.durationMin : 0;

    const loc = a.location || null;
    const mov = a.movement || null;
    const acts = Array.isArray(a.activity) ? a.activity : [];

    return { dayKey, startMs, durMin, loc, mov, acts };
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
      t[k] = (t[k] || 0) + s.durMin;
    }
    return t;
  }

  function aggActivities(sessions){
    const t = {};
    for (const s of sessions){
      const acts = s.acts || [];
      const dur = s.durMin || 0;

      if (acts.length){
        const share = dur / acts.length;
        for (const act of acts){
          t[act] = (t[act] || 0) + share;
        }
      } else {
        t["(No Activity)"] = (t["(No Activity)"] || 0) + dur;
      }
    }
    return t;
  }

  // average per day across days where the item appears (more useful than dividing by all days)
  function avgPerDay(byDay, aggFn){
    const days = Object.keys(byDay).filter(k => k !== "unknown");
    const totals = {};
    const counts = {};
    for (const dk of days){
      const m = aggFn(byDay[dk]);
      for (const [k, v] of Object.entries(m)){
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
    for (const k of Object.keys(a||{})) set.add(k);
    for (const k of Object.keys(b||{})) set.add(k);
    for (const k of Object.keys(c||{})) set.add(k);
    return Array.from(set);
  }

  function buildRows(todayMap, ydayMap, avgMap, limit=14){
    const keys = mergeKeys(todayMap, ydayMap, avgMap);
    keys.sort((x,y)=> (todayMap[y]||0) - (todayMap[x]||0));
    const out = [];
    for (const k of keys.slice(0, limit)){
      const t = todayMap[k] || 0;
      const y = ydayMap[k] || 0;
      const a = avgMap[k] || 0;
      out.push({
        item: k,
        today: t,
        yday: y,
        avg: a,
        dAvg: t - a,
        dY: t - y
      });
    }
    return out;
  }

  function el(tag, cls){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function tableCard(title, subtitle, rows){
    const c = el("div","cardMini");
    const h = el("h3"); h.textContent = title;
    const m = el("div","meta"); m.textContent = subtitle;

    c.appendChild(h);
    c.appendChild(m);

    const table = el("div","table");
    const head = el("div","row head");
    head.innerHTML = `
      <div>Item</div>
      <div class="r">Today</div>
      <div class="r">Yday</div>
      <div class="r">Avg</div>
      <div class="r">T-Avg</div>
      <div class="r">T-Y</div>
    `;
    table.appendChild(head);

    if (!rows.length){
      const empty = el("div","meta");
      empty.style.marginTop = "10px";
      empty.textContent = "No data yet.";
      c.appendChild(empty);
      return c;
    }

    for (const r of rows){
      const row = el("div","row");
      const dAvg = r.dAvg >= 0 ? `+${fmtMin(r.dAvg)}` : `-${fmtMin(Math.abs(r.dAvg))}`;
      const dY = r.dY >= 0 ? `+${fmtMin(r.dY)}` : `-${fmtMin(Math.abs(r.dY))}`;
      row.innerHTML = `
        <div>${r.item}</div>
        <div class="r">${fmtMin(r.today)}</div>
        <div class="r">${fmtMin(r.yday)}</div>
        <div class="r">${fmtMin(r.avg)}</div>
        <div class="r">${dAvg}</div>
        <div class="r">${dY}</div>
      `;
      table.appendChild(row);
    }

    c.appendChild(table);
    return c;
  }

  function overviewCard(brain, byDay){
    const tk = todayKey();
    const yk = yesterdayKey();
    const todaySessions = byDay[tk] || [];
    const ydaySessions = byDay[yk] || [];

    const totalToday = todaySessions.reduce((a,s)=>a+(s.durMin||0), 0);
    const totalYday = ydaySessions.reduce((a,s)=>a+(s.durMin||0), 0);
    const dayCount = Object.keys(byDay).filter(k=>k!=="unknown").length;

    const c = el("div","cardMini");
    const h = el("h3"); h.textContent = "Overview";
    const m = el("div","meta");
    m.innerHTML = `
      Days tracked: ${dayCount}<br/>
      Today (${tk}): ${fmtMin(totalToday)} min<br/>
      Yesterday (${yk}): ${fmtMin(totalYday)} min
    `;
    c.appendChild(h);
    c.appendChild(m);

    if (brain && typeof brain.balance === "number"){
      const extra = el("div","meta");
      extra.style.marginTop = "10px";
      extra.innerHTML = `
        Balance: $${brain.balance.toFixed(2)}<br/>
        Multiplier: ${(brain.multiplier || 1).toFixed(2)}x<br/>
        Streak: ${brain.streak || 0}
      `;
      c.appendChild(extra);
    }

    return c;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const title = document.getElementById("wizTitle");
    const sub = document.getElementById("wizSub");
    const content = document.getElementById("wizContent");
    const back = document.getElementById("wizBack");
    const next = document.getElementById("wizNext");
    const pill = document.getElementById("wizStepPill");

    const brain = loadBrain();
    const rawSessions = sessionsFromBrain(brain);
    const byDay = groupByDay(rawSessions);

    const tk = todayKey();
    const yk = yesterdayKey();
    const todaySessions = byDay[tk] || [];
    const ydaySessions = byDay[yk] || [];

    const locToday = aggByKey(todaySessions, "loc");
    const locY = aggByKey(ydaySessions, "loc");
    const locAvg = avgPerDay(byDay, (ss)=>aggByKey(ss,"loc")).avg;

    const movToday = aggByKey(todaySessions, "mov");
    const movY = aggByKey(ydaySessions, "mov");
    const movAvg = avgPerDay(byDay, (ss)=>aggByKey(ss,"mov")).avg;

    const actToday = aggActivities(todaySessions);
    const actY = aggActivities(ydaySessions);
    const actAvg = avgPerDay(byDay, (ss)=>aggActivities(ss)).avg;

    const steps = [
      {
        name: "Overview",
        sub: "Today vs yesterday totals. Quick context.",
        render: () => {
          const wrap = el("div","cards");
          wrap.appendChild(overviewCard(brain, byDay));
          return wrap;
        }
      },
      {
        name: "Activities",
        sub: "Today vs yesterday vs your all-time average per day.",
        render: () => {
          const rows = buildRows(actToday, actY, actAvg, 16);
          const wrap = el("div","cards");
          wrap.appendChild(tableCard("Activities", "Minutes per activity (shared if multiple).", rows));
          return wrap;
        }
      },
      {
        name: "Locations",
        sub: "Time by location: today vs yesterday vs average/day.",
        render: () => {
          const rows = buildRows(locToday, locY, locAvg, 14);
          const wrap = el("div","cards");
          wrap.appendChild(tableCard("Locations", "Minutes per location.", rows));
          return wrap;
        }
      },
      {
        name: "Movement",
        sub: "Time by movement: today vs yesterday vs average/day.",
        render: () => {
          const rows = buildRows(movToday, movY, movAvg, 14);
          const wrap = el("div","cards");
          wrap.appendChild(tableCard("Movement", "Minutes per movement mode.", rows));
          return wrap;
        }
      },
      {
        name: "Export",
        sub: "Raw JSON copy view.",
        render: () => {
          const wrap = el("div","cards");
          const c = el("div","cardMini");
          const h = el("h3"); h.textContent = "Export (raw)";
          const m = el("div","meta"); m.textContent = "This is your local data.";
          const pre = el("pre");
          pre.style.whiteSpace = "pre-wrap";
          pre.style.wordBreak = "break-word";
          pre.style.margin = "10px 0 0";
          pre.style.fontSize = "12px";
          pre.textContent = localStorage.getItem("brain_state_v1") || "No raw data yet.";
          c.appendChild(h); c.appendChild(m); c.appendChild(pre);
          wrap.appendChild(c);
          return wrap;
        }
      }
    ];

    let idx = 0;

    function paint(){
      title.textContent = steps[idx].name;
      sub.textContent = steps[idx].sub;
      content.innerHTML = "";
      content.appendChild(steps[idx].render());

      pill.textContent = `Step ${idx+1}/${steps.length}`;
      back.disabled = idx === 0;
      next.textContent = (idx === steps.length - 1) ? "Done" : "Next";
    }

    back.addEventListener("click", () => {
      idx = Math.max(0, idx - 1);
      paint();
    });

    next.addEventListener("click", () => {
      if (idx === steps.length - 1){
        window.location.href = "index.html";
        return;
      }
      idx = Math.min(steps.length - 1, idx + 1);
      paint();
    });

    paint();
  });
})();
