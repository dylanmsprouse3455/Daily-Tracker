document.addEventListener("DOMContentLoaded", () => {
  const s = Engine.getState();
  const sessions = s.sessions || [];

  document.getElementById("sessionCount").textContent = sessions.length;

  const recent = sessions.slice(-10).reverse().map(x => {
    const start = new Date(x.startMs).toLocaleString();
    const end = x.endMs ? new Date(x.endMs).toLocaleString() : "open";
    const a = x.active || {};
    const loc = a.location || "None";
    const mov = a.movement || "None";
    const act = (a.activity && a.activity.length) ? a.activity.join(", ") : "None";
    const dur = (x.durationMin || 0).toFixed(2);
    return `${start} -> ${end}\n${loc} | ${mov} | ${act}\n${dur} mins\n`;
  }).join("\n");

  document.getElementById("recentSessions").textContent = recent || "No sessions yet.";
});