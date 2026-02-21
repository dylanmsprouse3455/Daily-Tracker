function safeParse(x){
  try { return JSON.parse(x); } catch { return x; }
}

function dumpStorage(){
  const out = {};
  for (let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i);
    out[k] = safeParse(localStorage.getItem(k));
  }
  return out;
}

function minutes(n){
  return (typeof n === "number" && isFinite(n)) ? n : 0;
}

function render(){
  const all = dumpStorage();
  document.getElementById("rawDump").textContent = JSON.stringify(all, null, 2);

  // We will support BOTH:
  // A) Future session key: state_tracker_sessions (array)
  // B) Future brain key: brain_state_v1 (object with sessions)
  // C) Fallback: just show what exists

  let sessions = [];

  if (Array.isArray(all.state_tracker_sessions)) {
    sessions = all.state_tracker_sessions;
  } else if (all.brain_state_v1 && Array.isArray(all.brain_state_v1.sessions)) {
    sessions = all.brain_state_v1.sessions;
  }

  document.getElementById("sessionCount").textContent = String(sessions.length);

  // Aggregate totals by "item" (location, movement, activity)
  const totals = {};
  let tracked = 0;

  sessions.forEach(s => {
    const dur = minutes(s.durationMin) || minutes(s.duration) || 0;
    tracked += dur;

    const a = s.active || s.state || s || {};
    const loc = a.location;
    const mov = a.movement;
    const acts = Array.isArray(a.activity) ? a.activity : [];

    if (loc) totals["Location: " + loc] = (totals["Location: " + loc] || 0) + dur;
    if (mov) totals["Movement: " + mov] = (totals["Movement: " + mov] || 0) + dur;

    if (acts.length){
      const share = dur / acts.length;
      acts.forEach(act => {
        totals["Activity: " + act] = (totals["Activity: " + act] || 0) + share;
      });
    }
  });

  const entries = Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  document.getElementById("uniqueStates").textContent = String(entries.length);
  document.getElementById("trackedMins").textContent = tracked.toFixed(1);

  const top = entries.slice(0, 8);
  const topList = document.getElementById("topList");
  if (!sessions.length){
    topList.textContent = "No session data yet. Once the brain logs sessions, this fills in automatically.";
  } else if (!top.length){
    topList.textContent = "Sessions exist, but no structured state fields found.";
  } else {
    topList.innerHTML = top.map(([k,v]) => `${k} — ${v.toFixed(1)}m`).join("<br>");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("copyRawBtn").addEventListener("click", () => {
    const txt = document.getElementById("rawDump").textContent;
    navigator.clipboard.writeText(txt).then(()=>alert("Copied.")).catch(()=>alert("Copy failed."));
  });

  document.getElementById("refreshBtn").addEventListener("click", render);

  render();
});