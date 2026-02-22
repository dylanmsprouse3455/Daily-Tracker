// analytics.js (FULL) - bubbly wizard analytics
// Shows: Today snapshot, Today vs Yesterday, Today vs Avg/day, Yesterday vs Avg/day, Export
// Data source: Engine.getState() if present, else localStorage "brain_state_v1"

(() => {
  const $ = (id) => document.getElementById(id);

  function fmtMin(n){
    if (typeof n !== "number" || !isFinite(n)) return "0.0";
    return n.toFixed(1);
  }

  function signDelta(n){
    if (!isFinite(n)) n = 0;
    const sign = n >= 0 ? "+" : "-";
    return sign + fmtMin(Math.abs(n));
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
    if (brain.store && Array.isArray(brain.store.sessions)) return brain.store.sessions;
    return [];
  }

  function normSession(raw){
    const a = raw.active || {};
    const startMs = typeof raw.startMs === "number" ? raw.startMs : null;
    const dayKey = startMs ? dayKeyFromMs(startMs) : "unknown";

    const durMin = typeof raw.durationMin === "number" ? raw.durationMin : 0;

    const loc = a.location || null;
    const mov = a.movement || null;
    const acts = Array.isArray(a.activity) ? a.activity : [];

    const net = (raw.delta && typeof raw.delta.net === "number") ? raw.delta.net : 0;

    return { dayKey, startMs, durMin, loc, mov, acts, net };
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

  // avg minutes per day across days where the item appears
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

  function deltaClass(n){
    if (!isFinite(n)) n = 0;
    if (Math.abs(n) < 0.25) return "deltaFlat";
    return n > 0 ? "deltaUp" : "deltaDown";
  }

  function el(tag, cls){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function card(title, meta){
    const c = el("div","card");
    const t = el("div","cardTitle"); t.textContent = title;
    const m = el("div","cardMeta"); m.textContent = meta || "";
    c.appendChild(t);
    if (meta) c.appendChild(m);
    return c;
  }

  function pillRowItem(name, mins, deltaText, deltaVal){
    const pill = el("div","itemPill");

    const left = el("div","itemLeft");
    const nm = el("div","itemName"); nm.textContent = name;
    const sub = el("div","itemSub"); sub.textContent = `${fmtMin(mins)} min`;
    left.appendChild(nm);
    left.appendChild(sub);

    const right = el("div","itemRight");
    const minB = el("div","minBadge"); minB.textContent = fmtMin(mins) + "m";
    const delB = el("div","deltaBadge " + deltaClass(deltaVal)); delB.textContent = deltaText;

    right.appendChild(minB);
    right.appendChild(delB);

    pill.appendChild(left);
    pill.appendChild(right);
    return pill;
  }

  function topList(mapObj, compareMap, compareLabel, limit=6){
    const keys = mergeKeys(mapObj, compareMap, {});
    keys.sort((a,b)=> (mapObj[b]||0) - (mapObj[a]||0));
    const picked = keys.slice(0, limit);

    const wrap = el("div","pillRow");
    if (!picked.length){
      const empty = el("div","cardMeta");
      empty.textContent = "No data yet.";
      wrap.appendChild(empty);
      return wrap;
    }

    for (const k of picked){
      const t = mapObj[k] || 0;
      const c = compareMap[k] || 0;
      const d = t - c;
      wrap.appendChild(
        pillRowItem(
          k,
          t,
          `${compareLabel} ${signDelta(d)}`,
          d
        )
      );
    }
    return wrap;
  }

  function computeBiggestDelta(todayMap, avgMap){
    const keys = mergeKeys(todayMap, avgMap, {});
    let best = null;
    for (const k of keys){
      const t = todayMap[k] || 0;
      const a = avgMap[k] || 0;
      const d = t - a;
      if (!best || Math.abs(d) > Math.abs(best.d)) best = { k, t, a, d };
    }
    return best;
  }

  async function copyToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch{
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const wizTitle = $("wizTitle");
    const wizSub = $("wizSub");
    const wizContent = $("wizContent");
    const wizBack = $("wizBack");
    const wizNext = $("wizNext");
    const wizStepPill = $("wizStepPill");

    const brain = loadBrain();
    const rawSessions = sessionsFromBrain(brain);

    if (!rawSessions.length){
      wizTitle.textContent = "Analytics";
      wizSub.textContent = "No sessions yet. Go track on the main page first.";
      wizContent.innerHTML = "";
      const g = el("div","grid");
      const c = card("No data found", "Track for a bit, then come back here.");
      g.appendChild(c);
      wizContent.appendChild(g);

      wizBack.disabled = true;
      wizNext.textContent = "Go to tracker";
      wizStepPill.textContent = "Step 1/1";
      wizNext.onclick = () => window.location.href = "index.html";
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

    // maps for each dimension
    const locToday = aggByKey(todaySessions, "loc");
    const locY = aggByKey(ydaySessions, "loc");
    const locAvg = avgPerDay(byDay, (ss)=>aggByKey(ss,"loc")).avg;

    const movToday = aggByKey(todaySessions, "mov");
    const movY = aggByKey(ydaySessions, "mov");
    const movAvg = avgPerDay(byDay, (ss)=>aggByKey(ss,"mov")).avg;

    const actTodayObj = aggActivities(todaySessions);
    const actYObj = aggActivities(ydaySessions);
    const actAvg = avgPerDay(byDay, (ss)=>aggActivities(ss).t).avg;

    // step renderers
    const steps = [
      {
        name: "Today snapshot",
        sub: "A quick, human view of your day so far.",
        render: () => {
          const g = el("div","grid");

          const c1 = card("Today", `Total tracked: ${fmtMin(totalToday)} min`);
          const meta = el("div","cardMeta");
          meta.style.marginTop = "10px";
          meta.textContent = `Yesterday: ${fmtMin(totalYday)} min · Days tracked: ${dayCount}`;
          c1.appendChild(meta);
          g.appendChild(c1);

          const big = computeBiggestDelta(actTodayObj.t, actAvg);
          const c2 = card("Biggest change vs your normal", "Compared to your all-time average per day.");
          if (big){
            const wrap = el("div","pillRow");
            wrap.appendChild(
              pillRowItem(
                big.k,
                big.t,
                `vs Avg ${signDelta(big.d)}`,
                big.d
              )
            );
            c2.appendChild(wrap);
          } else {
            const m = el("div","cardMeta");
            m.style.marginTop = "10px";
            m.textContent = "Not enough data yet.";
            c2.appendChild(m);
          }
          g.appendChild(c2);

          const c3 = card("Top activities today", "Compared to yesterday.");
          c3.appendChild(topList(actTodayObj.t, actYObj.t, "vs Yday", 6));
          g.appendChild(c3);

          return g;
        }
      },
      {
        name: "Today vs Yesterday",
        sub: "See what shifted since yesterday.",
        render: () => {
          const g = el("div","grid");

          const a = card("Activities", "Top items today, delta vs yesterday.");
          a.appendChild(topList(actTodayObj.t, actYObj.t, "vs Yday", 7));
          g.appendChild(a);

          const l = card("Locations", "Top items today, delta vs yesterday.");
          l.appendChild(topList(locToday, locY, "vs Yday", 6));
          g.appendChild(l);

          const m = card("Movement", "Top items today, delta vs yesterday.");
          m.appendChild(topList(movToday, movY, "vs Yday", 6));
          g.appendChild(m);

          return g;
        }
      },
      {
        name: "Today vs Average",
        sub: "Compare today to your all-time average per day.",
        render: () => {
          const g = el("div","grid");

          const a = card("Activities", "Delta vs your all-time avg/day.");
          a.appendChild(topList(actTodayObj.t, actAvg, "vs Avg", 7));
          g.appendChild(a);

          const l = card("Locations", "Delta vs your all-time avg/day.");
          l.appendChild(topList(locToday, locAvg, "vs Avg", 6));
          g.appendChild(l);

          const m = card("Movement", "Delta vs your all-time avg/day.");
          m.appendChild(topList(movToday, movAvg, "vs Avg", 6));
          g.appendChild(m);

          return g;
        }
      },
      {
        name: "Yesterday vs Average",
        sub: "How yesterday compared to your normal.",
        render: () => {
          const g = el("div","grid");

          const a = card("Activities", "Delta (yesterday minus avg/day).");
          a.appendChild(topList(actYObj.t, actAvg, "vs Avg", 7));
          g.appendChild(a);

          const l = card("Locations", "Delta (yesterday minus avg/day).");
          l.appendChild(topList(locY, locAvg, "vs Avg", 6));
          g.appendChild(l);

          const m = card("Movement", "Delta (yesterday minus avg/day).");
          m.appendChild(topList(movY, movAvg, "vs Avg", 6));
          g.appendChild(m);

          return g;
        }
      },
      {
        name: "Export",
        sub: "Raw JSON for debugging and sharing.",
        render: () => {
          const g = el("div","grid");

          const c = card("Raw JSON", "Copy this if something looks off.");
          const pre = document.createElement("pre");
          pre.className = "raw";
          pre.textContent = localStorage.getItem("brain_state_v1") || "(No brain_state_v1 found)";
          c.appendChild(pre);

          const btnRow = document.createElement("div");
          btnRow.style.display = "flex";
          btnRow.style.gap = "10px";
          btnRow.style.marginTop = "12px";

          const copyBtn = document.createElement("button");
          copyBtn.className = "btn small ghost";
          copyBtn.type = "button";
          copyBtn.textContent = "Copy raw JSON";
          copyBtn.onclick = async () => {
            const ok = await copyToClipboard(pre.textContent || "");
            if (!ok) alert("Could not auto-copy. Long-press and copy manually.");
          };

          const doneBtn = document.createElement("button");
          doneBtn.className = "btn small ghost";
          doneBtn.type = "button";
          doneBtn.textContent = "Back to tracker";
          doneBtn.onclick = () => window.location.href = "index.html";

          btnRow.appendChild(copyBtn);
          btnRow.appendChild(doneBtn);
          c.appendChild(btnRow);

          g.appendChild(c);
          return g;
        }
      }
    ];

    let idx = 0;

    function paint(){
      wizTitle.textContent = steps[idx].name;
      wizSub.textContent = steps[idx].sub;

      wizContent.innerHTML = "";
      wizContent.appendChild(steps[idx].render());

      wizStepPill.textContent = `Step ${idx + 1}/${steps.length}`;
      wizBack.disabled = idx === 0;
      wizNext.textContent = (idx === steps.length - 1) ? "Done" : "Next";
    }

    wizBack.onclick = () => {
      idx = Math.max(0, idx - 1);
      paint();
    };

    wizNext.onclick = () => {
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
