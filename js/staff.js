(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  const staffForm = document.getElementById("staff-form");
  const staffFormStatus = document.getElementById("staff-form-status");
  const staffUserSelect = document.getElementById("staff-user");
  const staffAreaSelect = document.getElementById("staff-area");
  const staffShiftSelect = document.getElementById("staff-shift");
  const staffStatusSelect = document.getElementById("staff-status");
  const staffLeadInput = document.getElementById("staff-lead");
  const staffStartInput = document.getElementById("staff-start");
  const staffSlaInput = document.getElementById("staff-sla");
  const staffScoreInput = document.getElementById("staff-score");
  const staffNotesInput = document.getElementById("staff-notes");
  const staffScheduleList = document.getElementById("staff-schedule-list");
  const staffKpiList = document.getElementById("staff-kpi-list");
  const staffRequestsList = document.getElementById("staff-requests-list");
  const staffAlertsList = document.getElementById("staff-alerts-list");
  const staffTrainingList = document.getElementById("staff-training-list");
  const staffFeedbackList = document.getElementById("staff-feedback-list");

  const requestQueue = [
    {
      id: "req_1",
      staff: "Diego A. Mendez Lopez",
      type: "Acceso",
      note: "Solicita acceso a modulo de precios.",
      priority: "alta",
      status: "pendiente",
    },
    {
      id: "req_2",
      staff: "Lucia Vega Torres",
      type: "Vacaciones",
      note: "5 dias desde 2025-01-12.",
      priority: "media",
      status: "pendiente",
    },
    {
      id: "req_3",
      staff: "Mario Silva Rojas",
      type: "Cambio de turno",
      note: "Cambia a turno tarde por 2 semanas.",
      priority: "baja",
      status: "pendiente",
    },
  ];

  const alertQueue = [
    {
      id: "alert_1",
      title: "SLA soporte en riesgo",
      area: "Soporte",
      detail: "Backlog supera 30 tickets por mas de 2 horas.",
      severity: "alta",
      status: "abierta",
    },
    {
      id: "alert_2",
      title: "Cliente enterprise sin onboarding",
      area: "Implementacion",
      detail: "Atraso de 5 dias en activacion.",
      severity: "media",
      status: "abierta",
    },
    {
      id: "alert_3",
      title: "Caida en cobranza automatica",
      area: "Finanzas",
      detail: "Fallaron 12 cargos nocturnos.",
      severity: "alta",
      status: "en-seguimiento",
    },
  ];

  const trainingPlan = [
    {
      id: "training_1",
      title: "Onboarding seguridad y MFA",
      area: "Todos",
      due: "2025-01-05",
      progress: 72,
      mandatory: true,
    },
    {
      id: "training_2",
      title: "Protocolos de soporte premium",
      area: "Soporte",
      due: "2025-01-12",
      progress: 48,
      mandatory: false,
    },
    {
      id: "training_3",
      title: "Renovacion de contratos",
      area: "Ventas",
      due: "2025-01-19",
      progress: 90,
      mandatory: true,
    },
  ];

  const feedbackQueue = [
    {
      id: "feedback_1",
      staff: "Diego A. Mendez Lopez",
      type: "1:1 mensual",
      date: "2025-01-07",
      status: "pendiente",
    },
    {
      id: "feedback_2",
      staff: "Lucia Vega Torres",
      type: "Evaluacion trimestral",
      date: "2025-01-10",
      status: "confirmado",
    },
    {
      id: "feedback_3",
      staff: "Mario Silva Rojas",
      type: "Plan de mejora",
      date: "2025-01-15",
      status: "pendiente",
    },
  ];

  function setStatus(message, tone) {
    if (!staffFormStatus) {
      return;
    }
    staffFormStatus.textContent = message || "";
    staffFormStatus.classList.toggle("is-error", tone === "error");
    staffFormStatus.classList.toggle("is-success", tone === "success");
  }

  function getStaffUsers() {
    return N.state.users.filter(
      (user) => N.utils.normalizeUserType(user.userType) === "admin"
    );
  }

  function renderStaffSelect() {
    if (!staffUserSelect) {
      return;
    }
    const staffUsers = getStaffUsers();
    staffUserSelect.innerHTML = "";
    if (!staffUsers.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Sin staff";
      staffUserSelect.appendChild(option);
      return;
    }
    staffUsers.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = N.utils.buildUserDisplayName(user);
      staffUserSelect.appendChild(option);
    });
  }

  function buildStaffStatusLabel(status) {
    if (status === "pausa") {
      return "En pausa";
    }
    if (status === "vacaciones") {
      return "Vacaciones";
    }
    return "Activo";
  }

  function buildStatusChip(status) {
    if (status === "pausa") {
      return "chip-warn";
    }
    if (status === "vacaciones") {
      return "chip-alert";
    }
    return "chip-live";
  }

  function parseNumber(value, fallback = 0) {
    const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatShortDate(value) {
    if (!value) {
      return "-";
    }
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  function renderScheduleList() {
    if (!staffScheduleList) {
      return;
    }
    staffScheduleList.innerHTML = "";

    const head = document.createElement("div");
    head.className = "table-row is-head";
    head.innerHTML = "<span>Staff</span><span>Area</span><span>Turno</span><span>Estado</span>";
    staffScheduleList.appendChild(head);

    const staffUsers = getStaffUsers();
    if (!staffUsers.length) {
      const empty = document.createElement("div");
      empty.className = "list-item";
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = "Sin asignaciones registradas.";
      empty.appendChild(note);
      staffScheduleList.appendChild(empty);
      return;
    }

    staffUsers.forEach((user) => {
      const row = document.createElement("div");
      row.className = "table-row";
      row.dataset.userId = user.id;
      const statusLabel = buildStaffStatusLabel(user.staffStatus);
      row.innerHTML = `
        <span class="table-cell table-strong">${N.utils.buildUserDisplayName(user)}</span>
        <span class="table-cell">${user.staffArea || "Sin area"}</span>
        <span class="table-cell">${user.staffShift || "Sin turno"}</span>
        <span class="table-cell">${statusLabel}</span>
      `;
      staffScheduleList.appendChild(row);
    });
  }

  function renderKpiList() {
    if (!staffKpiList) {
      return;
    }
    staffKpiList.innerHTML = "";

    const head = document.createElement("div");
    head.className = "table-row is-head";
    head.innerHTML =
      "<span>Staff</span><span>SLA</span><span>KPI</span><span>Lider</span>";
    staffKpiList.appendChild(head);

    const staffUsers = getStaffUsers();
    if (!staffUsers.length) {
      const empty = document.createElement("div");
      empty.className = "list-item";
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = "Sin indicadores cargados.";
      empty.appendChild(note);
      staffKpiList.appendChild(empty);
      return;
    }

    staffUsers.forEach((user) => {
      const row = document.createElement("div");
      row.className = "table-row";
      const sla = parseNumber(user.staffSla, 0);
      const score = parseNumber(user.staffScore, 0);
      row.innerHTML = `
        <span class="table-cell table-strong">${N.utils.buildUserDisplayName(user)}</span>
        <span class="table-cell">${sla ? `${sla}%` : "-"}</span>
        <span class="table-cell">${score ? `${score} pts` : "-"}</span>
        <span class="table-cell">${user.staffLead || "-"}</span>
      `;
      staffKpiList.appendChild(row);
    });
  }

  function renderRequests() {
    if (!staffRequestsList) {
      return;
    }
    staffRequestsList.innerHTML = "";

    requestQueue.forEach((request) => {
      const item = document.createElement("li");
      item.className = "list-item";
      item.dataset.requestId = request.id;

      const info = document.createElement("div");
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = `${request.type} - ${request.staff}`;
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = request.note;
      info.appendChild(title);
      info.appendChild(note);

      const actions = document.createElement("div");
      actions.className = "list-actions";
      const chip = document.createElement("span");
      chip.className = `chip ${request.priority === "alta" ? "chip-alert" : "chip-warn"}`;
      chip.textContent = request.priority;
      actions.appendChild(chip);
      if (request.status === "pendiente") {
        const approve = document.createElement("button");
        approve.type = "button";
        approve.className = "btn btn-ghost btn-xs";
        approve.dataset.action = "approve";
        approve.textContent = "Aprobar";
        const reject = document.createElement("button");
        reject.type = "button";
        reject.className = "btn btn-ghost btn-xs";
        reject.dataset.action = "reject";
        reject.textContent = "Rechazar";
        actions.appendChild(approve);
        actions.appendChild(reject);
      } else {
        const statusChip = document.createElement("span");
        statusChip.className = `chip ${request.status === "aprobado" ? "chip-live" : "chip-alert"}`;
        statusChip.textContent = request.status;
        actions.appendChild(statusChip);
      }

      item.appendChild(info);
      item.appendChild(actions);
      staffRequestsList.appendChild(item);
    });
  }

  function renderAlerts() {
    if (!staffAlertsList) {
      return;
    }
    staffAlertsList.innerHTML = "";

    alertQueue.forEach((alert) => {
      const item = document.createElement("li");
      item.className = "list-item";
      item.dataset.alertId = alert.id;

      const info = document.createElement("div");
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = `${alert.title} · ${alert.area}`;
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = alert.detail;
      info.appendChild(title);
      info.appendChild(note);

      const actions = document.createElement("div");
      actions.className = "list-actions";
      const chip = document.createElement("span");
      chip.className = `chip ${alert.severity === "alta" ? "chip-alert" : "chip-warn"}`;
      chip.textContent = alert.severity;
      actions.appendChild(chip);

      if (alert.status === "abierta") {
        const assign = document.createElement("button");
        assign.type = "button";
        assign.className = "btn btn-ghost btn-xs";
        assign.dataset.action = "assign";
        assign.textContent = "Atender";
        const resolve = document.createElement("button");
        resolve.type = "button";
        resolve.className = "btn btn-ghost btn-xs";
        resolve.dataset.action = "resolve";
        resolve.textContent = "Resolver";
        actions.appendChild(assign);
        actions.appendChild(resolve);
      } else if (alert.status === "en-seguimiento") {
        const resolve = document.createElement("button");
        resolve.type = "button";
        resolve.className = "btn btn-ghost btn-xs";
        resolve.dataset.action = "resolve";
        resolve.textContent = "Resolver";
        actions.appendChild(resolve);
      } else {
        const statusChip = document.createElement("span");
        statusChip.className = "chip chip-live";
        statusChip.textContent = "resuelta";
        actions.appendChild(statusChip);
      }

      item.appendChild(info);
      item.appendChild(actions);
      staffAlertsList.appendChild(item);
    });
  }

  function renderTraining() {
    if (!staffTrainingList) {
      return;
    }
    staffTrainingList.innerHTML = "";

    trainingPlan.forEach((training) => {
      const card = document.createElement("div");
      card.className = "goal-card";
      const dueLabel = formatShortDate(training.due);
      card.innerHTML = `
        <div class="goal-head">
          <p class="list-title">${training.title}</p>
          <span class="chip ${training.mandatory ? "chip-warn" : "chip-soft"}">
            ${training.mandatory ? "Obligatorio" : "Sugerido"}
          </span>
        </div>
        <p class="list-note">Equipo: ${training.area} · Vence ${dueLabel}</p>
        <div class="progress" style="--value: ${training.progress}%">
          <span class="progress-bar"></span>
        </div>
        <p class="progress-note">${training.progress}% completado</p>
      `;
      staffTrainingList.appendChild(card);
    });
  }

  function renderFeedback() {
    if (!staffFeedbackList) {
      return;
    }
    staffFeedbackList.innerHTML = "";

    feedbackQueue.forEach((session) => {
      const item = document.createElement("li");
      item.className = "list-item";
      item.dataset.feedbackId = session.id;

      const info = document.createElement("div");
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = `${session.type} · ${session.staff}`;
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = `Fecha: ${formatShortDate(session.date)}`;
      info.appendChild(title);
      info.appendChild(note);

      const actions = document.createElement("div");
      actions.className = "list-actions";
      if (session.status === "pendiente") {
        const confirm = document.createElement("button");
        confirm.type = "button";
        confirm.className = "btn btn-ghost btn-xs";
        confirm.dataset.action = "confirm";
        confirm.textContent = "Confirmar";
        const reschedule = document.createElement("button");
        reschedule.type = "button";
        reschedule.className = "btn btn-ghost btn-xs";
        reschedule.dataset.action = "reschedule";
        reschedule.textContent = "Reagendar";
        actions.appendChild(confirm);
        actions.appendChild(reschedule);
      } else {
        const statusChip = document.createElement("span");
        statusChip.className = session.status === "confirmado" ? "chip chip-live" : "chip chip-warn";
        statusChip.textContent = session.status;
        actions.appendChild(statusChip);
      }

      item.appendChild(info);
      item.appendChild(actions);
      staffFeedbackList.appendChild(item);
    });
  }

  async function handleStaffSubmit(event) {
    event.preventDefault();
    if (!staffForm) {
      return;
    }
    setStatus("", "");

    const staffId = staffUserSelect?.value || "";
    if (!staffId) {
      setStatus("Selecciona un colaborador valido.", "error");
      return;
    }
    const staffUser = N.state.users.find((user) => user.id === staffId);
    if (!staffUser) {
      setStatus("Colaborador no encontrado.", "error");
      return;
    }

    staffUser.staffArea = staffAreaSelect?.value || "";
    staffUser.staffShift = staffShiftSelect?.value || "";
    staffUser.staffStatus = staffStatusSelect?.value || "";
    staffUser.staffLead = staffLeadInput?.value?.trim() || "";
    staffUser.staffStart = staffStartInput?.value || "";
    staffUser.staffSla = staffSlaInput?.value || "";
    staffUser.staffScore = staffScoreInput?.value || "";
    staffUser.staffNotes = staffNotesInput?.value?.trim() || "";
    staffUser.staffUpdatedAt = new Date().toISOString();

    if (N.data?.saveState) {
      await N.data.saveState();
    }
    renderAll();
    setStatus("Asignacion guardada para el staff.", "success");
  }

  function handleRequestAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }
    const item = button.closest("[data-request-id]");
    if (!item) {
      return;
    }
    const request = requestQueue.find((req) => req.id === item.dataset.requestId);
    if (!request) {
      return;
    }
    if (button.dataset.action === "approve") {
      request.status = "aprobado";
    }
    if (button.dataset.action === "reject") {
      request.status = "rechazado";
    }
    renderRequests();
  }

  function handleAlertAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }
    const item = button.closest("[data-alert-id]");
    if (!item) {
      return;
    }
    const alert = alertQueue.find((entry) => entry.id === item.dataset.alertId);
    if (!alert) {
      return;
    }
    if (button.dataset.action === "assign") {
      alert.status = "en-seguimiento";
    }
    if (button.dataset.action === "resolve") {
      alert.status = "resuelta";
    }
    renderAlerts();
  }

  function handleFeedbackAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }
    const item = button.closest("[data-feedback-id]");
    if (!item) {
      return;
    }
    const session = feedbackQueue.find((entry) => entry.id === item.dataset.feedbackId);
    if (!session) {
      return;
    }
    if (button.dataset.action === "confirm") {
      session.status = "confirmado";
    }
    if (button.dataset.action === "reschedule") {
      session.status = "reprogramado";
    }
    renderFeedback();
  }

  function renderAll() {
    renderStaffSelect();
    renderScheduleList();
    renderKpiList();
    renderRequests();
    renderAlerts();
    renderTraining();
    renderFeedback();
  }

  function init() {
    if (staffForm) {
      staffForm.addEventListener("submit", handleStaffSubmit);
    }
    if (staffRequestsList) {
      staffRequestsList.addEventListener("click", handleRequestAction);
    }
    if (staffAlertsList) {
      staffAlertsList.addEventListener("click", handleAlertAction);
    }
    if (staffFeedbackList) {
      staffFeedbackList.addEventListener("click", handleFeedbackAction);
    }
  }

  N.staff = {
    renderAll,
    init,
  };
})();
