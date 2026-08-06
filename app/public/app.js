(async function () {
  const listEl = document.getElementById("list");
  const countEl = document.getElementById("count");
  const healthEl = document.getElementById("health");
  const clockEl = document.getElementById("clock");
  const statOpen = document.getElementById("stat-open");
  const statAcked = document.getElementById("stat-acked");
  const statTotal = document.getElementById("stat-total");

  function tickClock() {
    clockEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  tickClock();
  setInterval(tickClock, 1000);

  async function loadHealth() {
    try {
      const r = await fetch("/api/health");
      const j = await r.json();
      healthEl.textContent = j.ok ? "live" : "down";
      healthEl.classList.toggle("ok", !!j.ok);
    } catch {
      healthEl.textContent = "down";
    }
  }

  function updateStats(alerts) {
    const open = alerts.filter((a) => a.status === "open").length;
    const acked = alerts.filter((a) => a.status === "acked").length;
    statOpen.textContent = String(open);
    statAcked.textContent = String(acked);
    statTotal.textContent = String(alerts.length);
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  function render(alerts) {
    updateStats(alerts);
    countEl.textContent = `${alerts.length} showing`;
    listEl.innerHTML = alerts.map((a) => `
      <li class="card" data-status="${a.status}" data-priority="${a.priority ? escapeHtml(a.priority) : ""}" data-id="${a.id}">
        <div class="desk">${escapeHtml(a.desk)}</div>
        <div class="msg">${escapeHtml(a.message)}</div>
        <div class="meta-row">
          <span class="badge ${a.status}">${escapeHtml(a.status)}</span>
          ${a.priority ? `<span class="badge priority ${escapeHtml(a.priority)}">${escapeHtml(a.priority)}</span>` : ""}
          <span class="time">${escapeHtml(formatTime(a.createdAt))}</span>
        </div>
      </li>
    `).join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  async function loadAlerts() {
    const r = await fetch("/api/alerts");
    const j = await r.json();
    render(j.alerts || []);
  }

  await loadHealth();
  await loadAlerts();
  // Track Alpha: wire filters into #filters
  // Track Bravo: wire create form into #create-slot
  // Track Charlie: ensure priority badges render + style them
})();
