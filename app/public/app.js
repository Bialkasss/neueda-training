(async function () {
  const listEl = document.getElementById("list");
  const countEl = document.getElementById("count");
  const healthEl = document.getElementById("health");
  const clockEl = document.getElementById("clock");
  const statOpen = document.getElementById("stat-open");
  const statAcked = document.getElementById("stat-acked");
  const statTotal = document.getElementById("stat-total");
  const filtersEl = document.getElementById("filters");
  const filterChips = Array.from(filtersEl?.querySelectorAll("[data-filter]") || []);

  let activeFilter = "all";
  let allAlerts = [];
  const createForm = document.getElementById("create-form");
  const createFeedback = document.getElementById("create-feedback");

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

  function getFilteredAlerts(alerts) {
    if (activeFilter === "all") {
      return alerts;
    }
    return alerts.filter((a) => a.status === activeFilter);
  }

  function syncFilterUi() {
    filterChips.forEach((chip) => {
      const isActive = chip.dataset.filter === activeFilter;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderCurrentView() {
    render(getFilteredAlerts(allAlerts));
  }

  function render(alerts) {
    updateStats(allAlerts);
    countEl.textContent = `${alerts.length} showing`;
    listEl.innerHTML = alerts.map((a) => `
      <li class="card" data-status="${a.status}" data-priority="${a.priority ? escapeHtml(a.priority) : ""}" data-id="${a.id}">
        <div class="desk">${escapeHtml(a.desk)}</div>
        <div class="msg">${escapeHtml(a.message)}</div>
        <div class="meta-row">
          <span class="badge ${a.status}">${escapeHtml(a.status)}</span>
          ${a.category ? `<span class="badge category">${escapeHtml(a.category)}</span>` : ""}
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
    allAlerts = j.alerts || [];
    renderCurrentView();
  }

  function wireFilters() {
    if (!filtersEl || filterChips.length === 0) {
      return;
    }

    filtersEl.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-filter]");
      if (!chip) {
        return;
      }

      const nextFilter = chip.dataset.filter;
      if (!nextFilter || nextFilter === activeFilter) {
        return;
      }

      activeFilter = nextFilter;
      syncFilterUi();
      renderCurrentView();
    });

    syncFilterUi();
  }

  wireFilters();
  function setCreateFeedback(message, kind) {
    if (!createFeedback) return;
    createFeedback.textContent = message;
    createFeedback.classList.remove("ok", "error");
    if (kind) createFeedback.classList.add(kind);
  }

  async function createAlert(payload) {
    const r = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(j.error || "Failed to create signal");
    }
    return j;
  }

  if (createForm) {
    createForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(createForm);
      const desk = String(formData.get("desk") || "").trim();
      const message = String(formData.get("message") || "").trim();
      const category = String(formData.get("category") || "low");

      if (!desk) {
        setCreateFeedback("Desk is required.", "error");
        return;
      }
      if (!message) {
        setCreateFeedback("Message is required.", "error");
        return;
      }

      const submitBtn = createForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      setCreateFeedback("Posting signal...", null);

      try {
        await createAlert({ desk, message, category });
        createForm.reset();
        await loadAlerts();
        await loadHealth();
        setCreateFeedback("Signal posted.", "ok");
      } catch (err) {
        setCreateFeedback(err.message || "Could not post signal.", "error");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  await loadHealth();
  await loadAlerts();
  // Track Alpha: wire filters into #filters
  // Track Charlie: ensure priority badges render + style them
})();
