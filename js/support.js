(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  // Support operations: tickets, client health, and response templates.

  const ticketForm = document.getElementById("support-ticket-form");
  const ticketStatus = document.getElementById("support-ticket-status");
  const ticketList = document.getElementById("support-ticket-list");
  const companySelect = document.getElementById("support-company");
  const assigneeSelect = document.getElementById("support-assignee");
  const filterSearch = document.getElementById("support-filter-search");
  const filterStatus = document.getElementById("support-filter-status");
  const filterPriority = document.getElementById("support-filter-priority");
  const filterClear = document.getElementById("support-filter-clear");
  const healthList = document.getElementById("support-health-list");
  const templateForm = document.getElementById("support-template-form");
  const templateList = document.getElementById("support-template-list");

  function setStatus(message, tone) {
    if (!ticketStatus) {
      return;
    }
    ticketStatus.textContent = message || "";
    ticketStatus.classList.toggle("is-error", tone === "error");
    ticketStatus.classList.toggle("is-success", tone === "success");
  }

  function getSupportTemplates() {
    const meta = N.data?.getMeta ? N.data.getMeta() : N.state.meta;
    if (!meta.supportTemplates) {
      meta.supportTemplates = [];
    }
    return meta.supportTemplates;
  }

  function getCompanyById(id) {
    return N.state.companies.find((company) => company.id === id) || null;
  }

  function getAllTickets() {
    const tickets = [];
    N.state.companies.forEach((company) => {
      const list = Array.isArray(company.supportTickets) ? company.supportTickets : [];
      list.forEach((ticket) => {
        tickets.push({ ...ticket, companyName: company.name, companyId: company.id });
      });
    });
    return tickets;
  }

  function matchesTicketFilters(ticket) {
    const term = (filterSearch?.value || "").trim().toLowerCase();
    const status = filterStatus?.value || "all";
    const priority = filterPriority?.value || "all";

    if (status !== "all" && ticket.status !== status) {
      return false;
    }
    if (priority !== "all" && ticket.priority !== priority) {
      return false;
    }
    if (!term) {
      return true;
    }

    const haystack = [ticket.companyName, ticket.subject, ticket.id]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  }

  function renderCompanySelect() {
    if (!companySelect) {
      return;
    }
    companySelect.innerHTML = "";
    if (!N.state.companies.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Sin empresas";
      companySelect.appendChild(option);
      return;
    }
    N.state.companies.forEach((company) => {
      const option = document.createElement("option");
      option.value = company.id;
      const storeId = company.storeId || company.id;
      option.textContent = storeId ? `${company.name} - ${storeId}` : company.name;
      companySelect.appendChild(option);
    });
  }

  function renderAssignees() {
    if (!assigneeSelect) {
      return;
    }
    assigneeSelect.innerHTML = "";
    const staff = N.state.users.filter(
      (user) => N.utils.normalizeUserType(user.userType) === "admin"
    );
    if (!staff.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Sin staff";
      assigneeSelect.appendChild(option);
      return;
    }
    staff.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = N.utils.buildUserDisplayName(user);
      assigneeSelect.appendChild(option);
    });
  }

  function renderTicketList() {
    if (!ticketList) {
      return;
    }
    ticketList.innerHTML = "";
    const tickets = getAllTickets().filter(matchesTicketFilters);

    if (!tickets.length) {
      const empty = document.createElement("li");
      empty.className = "list-item";
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = "Sin tickets activos.";
      empty.appendChild(note);
      ticketList.appendChild(empty);
      return;
    }

    tickets.forEach((ticket) => {
      const item = document.createElement("li");
      item.className = "list-item user-item";
      item.dataset.ticketId = ticket.id;
      item.dataset.companyId = ticket.companyId;

      const info = document.createElement("div");
      info.className = "list-main";
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = `${ticket.subject} - ${ticket.companyName}`;
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = `Prioridad ${ticket.priority} - SLA ${ticket.slaHours || "-"} hrs`;
      info.appendChild(title);
      info.appendChild(note);

      const meta = document.createElement("div");
      meta.className = "list-meta";
      const metaAssignee = document.createElement("p");
      metaAssignee.className = "list-meta-line";
      metaAssignee.textContent = `Asignado: ${ticket.assigneeName || "Sin asignar"}`;
      const metaStatus = document.createElement("p");
      metaStatus.className = "list-meta-line";
      metaStatus.textContent = `Estado: ${ticket.status}`;
      meta.appendChild(metaAssignee);
      meta.appendChild(metaStatus);
      info.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "list-actions";
      const chip = document.createElement("span");
      chip.className = `chip ${ticket.priority === "alta" ? "chip-alert" : "chip-warn"}`;
      chip.textContent = ticket.status === "cerrado" ? "Cerrado" : "Activo";
      actions.appendChild(chip);
      const progress = document.createElement("button");
      progress.type = "button";
      progress.className = "btn btn-ghost btn-xs";
      progress.dataset.action = "progress";
      progress.textContent = "En progreso";
      const pause = document.createElement("button");
      pause.type = "button";
      pause.className = "btn btn-ghost btn-xs";
      pause.dataset.action = "pause";
      pause.textContent = "Pausar";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "btn btn-ghost btn-xs";
      close.dataset.action = "close";
      close.textContent = "Cerrar";
      actions.appendChild(progress);
      actions.appendChild(pause);
      actions.appendChild(close);

      item.appendChild(info);
      item.appendChild(actions);
      ticketList.appendChild(item);
    });
  }

  function renderTemplates() {
    if (!templateList) {
      return;
    }
    templateList.innerHTML = "";
    const templates = getSupportTemplates();
    if (!templates.length) {
      const empty = document.createElement("li");
      empty.className = "list-item";
      empty.textContent = "Sin plantillas guardadas.";
      templateList.appendChild(empty);
      return;
    }
    templates.forEach((template) => {
      const item = document.createElement("li");
      item.className = "list-item";
      const info = document.createElement("div");
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = template.title;
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = template.body;
      info.appendChild(title);
      info.appendChild(note);
      item.appendChild(info);
      templateList.appendChild(item);
    });
  }

  function renderHealthList() {
    if (!healthList) {
      return;
    }
    healthList.innerHTML = "";

    const head = document.createElement("div");
    head.className = "table-row is-head";
    head.innerHTML =
      "<span>Empresa</span><span>Sync</span><span>Incidentes</span><span>Riesgo</span><span>Accion</span>";
    healthList.appendChild(head);

    if (!N.state.companies.length) {
      const empty = document.createElement("div");
      empty.className = "list-item";
      empty.textContent = "Sin clientes registrados.";
      healthList.appendChild(empty);
      return;
    }

    N.state.companies.forEach((company) => {
      if (!company.health) {
        company.health = {
          syncStatus: "ok",
          incidentCount: 0,
          lastError: "",
          riskLevel: "normal",
          updatedAt: "",
        };
      }
      const row = document.createElement("div");
      row.className = "table-row";
      row.dataset.companyId = company.id;
      row.innerHTML = `
        <span class="table-cell table-strong">${company.name}</span>
        <span class="table-cell">${company.health.syncStatus || "ok"}</span>
        <span class="table-cell">${company.health.incidentCount || 0}</span>
        <span class="table-cell">${company.health.riskLevel || "normal"}</span>
        <span class="table-cell">
          <button class="btn btn-ghost btn-xs" type="button" data-action="incident">Registrar</button>
          <button class="btn btn-ghost btn-xs" type="button" data-action="resolve">Resolver</button>
        </span>
      `;
      healthList.appendChild(row);
    });
  }

  async function handleTicketSubmit(event) {
    event.preventDefault();
    if (!ticketForm) {
      return;
    }
    setStatus("", "");

    const data = new FormData(ticketForm);
    const companyId = String(data.get("company_id") || "").trim();
    const company = getCompanyById(companyId);
    if (!company) {
      setStatus("Selecciona una empresa valida.", "error");
      return;
    }

    const subject = String(data.get("subject") || "").trim();
    if (!subject) {
      setStatus("Ingresa un asunto valido.", "error");
      return;
    }

    if (!company.supportTickets) {
      company.supportTickets = [];
    }

    const assigneeId = String(data.get("assignee") || "").trim();
    const assigneeUser = N.state.users.find((user) => user.id === assigneeId);

    const ticket = {
      id: `tkt_${Date.now()}`,
      subject,
      priority: String(data.get("priority") || "media"),
      status: "abierto",
      slaHours: String(data.get("sla_hours") || "") || "",
      assigneeId,
      assigneeName: assigneeUser ? N.utils.buildUserDisplayName(assigneeUser) : "",
      notesInternal: String(data.get("notes_internal") || "").trim(),
      notesClient: String(data.get("notes_client") || "").trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    company.supportTickets.unshift(ticket);
    N.audit?.log({
      type: "support",
      title: "Ticket creado",
      detail: `Ticket ${ticket.subject} para ${company.name}.`,
      companyId: company.id,
      actor: N.session?.user?.email || "",
    });

    if (N.data?.saveState) {
      await N.data.saveState();
    }

    ticketForm.reset();
    renderTicketList();
    renderHealthList();
    setStatus("Ticket creado correctamente.", "success");
  }

  async function handleTicketAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }
    const item = button.closest("[data-ticket-id]");
    if (!item) {
      return;
    }
    const ticketId = item.dataset.ticketId;
    const company = getCompanyById(item.dataset.companyId);
    if (!company || !Array.isArray(company.supportTickets)) {
      return;
    }
    const ticket = company.supportTickets.find((entry) => entry.id === ticketId);
    if (!ticket) {
      return;
    }
    const action = button.dataset.action;
    if (action === "progress") {
      ticket.status = "en-progreso";
    }
    if (action === "pause") {
      ticket.status = "pausado";
    }
    if (action === "close") {
      ticket.status = "cerrado";
    }
    ticket.updatedAt = new Date().toISOString();

    N.audit?.log({
      type: "support",
      title: "Ticket actualizado",
      detail: `Ticket ${ticket.subject} -> ${ticket.status}.`,
      companyId: company.id,
      actor: N.session?.user?.email || "",
    });

    if (N.data?.saveState) {
      await N.data.saveState();
    }
    renderTicketList();
  }

  async function handleHealthAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }
    const row = button.closest("[data-company-id]");
    if (!row) {
      return;
    }
    const company = getCompanyById(row.dataset.companyId);
    if (!company) {
      return;
    }
    if (!company.health) {
      company.health = {
        syncStatus: "ok",
        incidentCount: 0,
        lastError: "",
        riskLevel: "normal",
        updatedAt: "",
      };
    }

    if (button.dataset.action === "incident") {
      company.health.incidentCount = (company.health.incidentCount || 0) + 1;
      company.health.syncStatus = "alerta";
      company.health.riskLevel = "alto";
      company.health.lastError = "Incidente reportado por soporte.";
    }
    if (button.dataset.action === "resolve") {
      company.health.syncStatus = "ok";
      company.health.riskLevel = "normal";
      company.health.lastError = "";
    }
    company.health.updatedAt = new Date().toISOString();

    N.audit?.log({
      type: "support",
      title: "Salud del cliente actualizada",
      detail: `Salud ${company.name} -> ${company.health.syncStatus}.`,
      companyId: company.id,
      actor: N.session?.user?.email || "",
    });

    if (N.data?.saveState) {
      await N.data.saveState();
    }
    renderHealthList();
  }

  async function handleTemplateSubmit(event) {
    event.preventDefault();
    if (!templateForm) {
      return;
    }
    const data = new FormData(templateForm);
    const title = String(data.get("title") || "").trim();
    const body = String(data.get("body") || "").trim();
    if (!title || !body) {
      return;
    }
    const templates = getSupportTemplates();
    templates.unshift({
      id: `tpl_${Date.now()}`,
      title,
      body,
      createdAt: new Date().toISOString(),
    });
    N.audit?.log({
      type: "support",
      title: "Plantilla creada",
      detail: `Plantilla ${title} guardada.`,
      actor: N.session?.user?.email || "",
    });
    if (N.data?.saveState) {
      await N.data.saveState();
    }
    templateForm.reset();
    renderTemplates();
  }

  function renderAll() {
    renderCompanySelect();
    renderAssignees();
    renderTicketList();
    renderHealthList();
    renderTemplates();
  }

  function init() {
    if (ticketForm) {
      ticketForm.addEventListener("submit", handleTicketSubmit);
    }
    if (ticketList) {
      ticketList.addEventListener("click", handleTicketAction);
    }
    if (healthList) {
      healthList.addEventListener("click", handleHealthAction);
    }
    if (templateForm) {
      templateForm.addEventListener("submit", handleTemplateSubmit);
    }
    if (filterSearch) {
      filterSearch.addEventListener("input", renderTicketList);
    }
    if (filterStatus) {
      filterStatus.addEventListener("change", renderTicketList);
    }
    if (filterPriority) {
      filterPriority.addEventListener("change", renderTicketList);
    }
    if (filterClear) {
      filterClear.addEventListener("click", () => {
        if (filterSearch) {
          filterSearch.value = "";
        }
        if (filterStatus) {
          filterStatus.value = "all";
        }
        if (filterPriority) {
          filterPriority.value = "all";
        }
        renderTicketList();
      });
    }

    renderAll();
  }

  N.support = {
    renderAll,
    init,
  };
})();

