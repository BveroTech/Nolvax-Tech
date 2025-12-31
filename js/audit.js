(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  // Audit timeline renderer shared by Panel and Auditoria pages.

  const auditTimeline = document.getElementById("audit-timeline");
  const panelTimeline = document.getElementById("panel-audit-timeline");

  function getAuditLog() {
    const meta = N.state.meta || {};
    return Array.isArray(meta.auditLog) ? meta.auditLog : [];
  }

  function formatTime(value) {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderTimeline(listElement, limit = 10) {
    if (!listElement) {
      return;
    }
    listElement.innerHTML = "";
    const items = getAuditLog().slice(0, limit);
    if (!items.length) {
      const empty = document.createElement("li");
      empty.innerHTML = "<span class=\"time\">--</span><div><p class=\"event-title\">Sin eventos</p><p class=\"event-note\">No hay movimientos recientes.</p></div>";
      listElement.appendChild(empty);
      return;
    }

    items.forEach((event) => {
      const item = document.createElement("li");
      const time = document.createElement("span");
      time.className = "time";
      time.textContent = formatTime(event.createdAt);
      const body = document.createElement("div");
      const title = document.createElement("p");
      title.className = "event-title";
      title.textContent = event.title || "Evento";
      const note = document.createElement("p");
      note.className = "event-note";
      const actor = event.actor ? ` - ${event.actor}` : "";
      note.textContent = `${event.detail || ""}${actor}`.trim();
      body.appendChild(title);
      body.appendChild(note);
      item.appendChild(time);
      item.appendChild(body);
      listElement.appendChild(item);
    });
  }

  function renderAll() {
    renderTimeline(auditTimeline, 20);
    renderTimeline(panelTimeline, 5);
  }

  if (!N.audit) {
    N.audit = {};
  }
  N.audit.render = renderAll;
})();

