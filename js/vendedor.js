(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  const sellerForm = document.getElementById("seller-form");
  const sellerStatus = document.getElementById("seller-form-status");
  const sellerClientList = document.getElementById("seller-client-list");
  const sellerCommissionList = document.getElementById("seller-commission-list");
  const sellerSearch = document.getElementById("seller-filter-search");
  const metricClients = document.getElementById("seller-metric-clients");
  const metricMrr = document.getElementById("seller-metric-mrr");
  const metricCommission = document.getElementById("seller-metric-commission");
  const metricPipeline = document.getElementById("seller-metric-pipeline");
  const goalMrr = document.getElementById("seller-goal-mrr");
  const goalClients = document.getElementById("seller-goal-clients");
  const goalConversion = document.getElementById("seller-goal-conversion");
  const goalMrrLabel = document.getElementById("seller-goal-mrr-label");
  const goalClientsLabel = document.getElementById("seller-goal-clients-label");
  const goalConversionLabel = document.getElementById("seller-goal-conversion-label");
  const goalMrrNote = document.getElementById("seller-goal-mrr-note");
  const goalClientsNote = document.getElementById("seller-goal-clients-note");
  const goalConversionNote = document.getElementById("seller-goal-conversion-note");
  const phoneInput = document.getElementById("seller-phone");
  const rutInput = document.getElementById("seller-rut");

  function getSellerId() {
    const email = N.session?.user?.email || "";
    return N.utils.normalizeEmail(email) || "vendedor";
  }

  function setStatus(message, tone) {
    if (!sellerStatus) {
      return;
    }
    sellerStatus.textContent = message || "";
    sellerStatus.classList.toggle("is-error", tone === "error");
    sellerStatus.classList.toggle("is-success", tone === "success");
  }

  function findCompanyByName(name) {
    const target = String(name || "").trim().toLowerCase();
    if (!target) {
      return null;
    }
    return N.state.companies.find(
      (company) => String(company.name || "").trim().toLowerCase() === target
    );
  }

  function ensureCompanyFromLead(name, plan, rut) {
    const existing = findCompanyByName(name);
    if (existing) {
      return existing;
    }
    const storeId = `lead_${Date.now()}`;
    const company = {
      id: storeId,
      storeId,
      name: name || "Empresa sin nombre",
      plan: plan || "Base",
      status: "active",
      taxId: rut || "",
      createdAt: new Date().toISOString(),
      modules: {
        pos: true,
        inventory: true,
        loyalty: true,
        sync: true,
        hardware: true,
        reports: true,
      },
      subscription: {
        plan: plan || "Base",
        status: "active",
        renewAt: "",
        killSwitch: false,
      },
      supportTickets: [],
      health: {
        syncStatus: "ok",
        incidentCount: 0,
        lastError: "",
        riskLevel: "normal",
        updatedAt: "",
      },
      products: [],
      analytics: {
        orders: 0,
        trendNote: "",
        updatedAt: "",
      },
    };
    N.state.companies.unshift(company);
    if (N.companies?.renderSelects) {
      N.companies.renderSelects();
    }
    return company;
  }

  function parsePercent(value) {
    const normalized = String(value || "").replace(/[^0-9.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function parseMoney(value) {
    const clean = String(value || "").replace(/[^\d]/g, "");
    return clean ? Number(clean) : 0;
  }

  function formatMoney(value) {
    try {
      return `CLP ${new Intl.NumberFormat("es-CL").format(value || 0)}`;
    } catch (_err) {
      return `CLP ${value || 0}`;
    }
  }

  function applyPhoneFormat() {
    if (!phoneInput) {
      return "";
    }
    const formatted = N.utils.formatChilePhoneInput(phoneInput.value);
    phoneInput.value = formatted;
    return formatted;
  }

  function applyRutFormat() {
    if (!rutInput) {
      return "";
    }
    const formatted = N.utils.formatRutInput(rutInput.value);
    rutInput.value = formatted;
    return formatted;
  }

  function buildSellerUser(formData) {
    const firstName = N.utils.formatCompactInput(formData.get("first_name"));
    const secondName = N.utils.formatSecondNameInput(formData.get("second_name"));
    const lastName1 = N.utils.formatCompactInput(formData.get("last_name"));
    const lastName2 = N.utils.formatCompactInput(formData.get("last_name2"));
    const names = [firstName, secondName].filter(Boolean).join(" ").trim();
    const lastNames = [lastName1, lastName2].filter(Boolean).join(" ").trim();
    const email = String(formData.get("email") || "").trim();
    const phoneLocal = N.utils.formatChilePhoneInput(formData.get("phone"));
    const phone = phoneLocal ? `+56 ${phoneLocal}` : "";
    const companyName = String(formData.get("company_name") || "").trim() || "Empresa sin nombre";
    const plan = String(formData.get("plan") || "").trim() || "Base";
    const rut = N.utils.formatRutInput(formData.get("rut"));
    const commissionRate = parsePercent(formData.get("commission_rate"));
    const commissionFixed = parseMoney(formData.get("commission_fixed"));
    const dealValue = parseMoney(formData.get("mrr"));
    const closeDate = String(formData.get("close_date") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    const company = ensureCompanyFromLead(companyName, plan, rut);

    return {
      id: `usr_${Date.now()}`,
      names: names || "Cliente",
      lastnames: lastNames,
      email,
      role: N.config.OWNER_ROLE_VALUE,
      company: company.name,
      companyId: company.id,
      userType: "cliente",
      phone,
      status: "active",
      plan,
      rut,
      salesOwner: getSellerId(),
      salesStatus: "prospecto",
      commissionRate,
      commissionFixed,
      dealValue,
      closeDate,
      notes,
    };
  }

  function upsertSellerUser(formData) {
    const data = buildSellerUser(formData);
    const targetEmail = N.utils.normalizeEmail(data.email);
    if (!targetEmail) {
      return null;
    }
    let user = N.state.users.find(
      (item) => N.utils.normalizeEmail(item.email) === targetEmail
    );
    if (user) {
      const owner = user.salesOwner || "";
      if (owner && owner !== getSellerId()) {
        setStatus("Este cliente ya esta asignado a otro vendedor.", "error");
        return null;
      }
      Object.assign(user, data);
    } else {
      user = data;
      N.state.users.unshift(user);
    }
    if (N.utils?.normalizeUserRecord) {
      N.utils.normalizeUserRecord(user);
    }
    return user;
  }

  function getSalesStatusLabel(status) {
    if (status === "cerrado") {
      return "Cerrado";
    }
    if (status === "en-seguimiento") {
      return "En seguimiento";
    }
    return "Prospecto";
  }

  function getSalesChip(status) {
    if (status === "cerrado") {
      return { label: "Cerrado", className: "chip-live" };
    }
    if (status === "en-seguimiento") {
      return { label: "Seguimiento", className: "chip-warn" };
    }
    return { label: "Prospecto", className: "chip-soft" };
  }

  function computeCommission(user) {
    const rate = Number(user.commissionRate) || 0;
    const fixed = Number(user.commissionFixed) || 0;
    const base = Number(user.dealValue) || 0;
    return Math.round((base * rate) / 100 + fixed);
  }

  function getSellerUsers() {
    const owner = getSellerId();
    return N.state.users.filter(
      (user) => N.utils.normalizeEmail(user.salesOwner) === owner
    );
  }

  function matchesSellerFilter(user) {
    const term = (sellerSearch?.value || "").trim().toLowerCase();
    if (!term) {
      return true;
    }
    const haystack = [
      N.utils.buildUserDisplayName(user),
      user.company || "",
      user.email || "",
      user.rut || "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  }

  function renderClientList() {
    if (!sellerClientList) {
      return;
    }
    const items = getSellerUsers().filter(matchesSellerFilter);
    sellerClientList.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "list-item";
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = "Sin clientes asignados";
      empty.appendChild(note);
      sellerClientList.appendChild(empty);
      return;
    }

    items.forEach((user) => {
      const item = document.createElement("li");
      item.className = "list-item user-item";
      item.dataset.userId = user.id;

      const info = document.createElement("div");
      info.className = "list-main";
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = N.utils.buildUserDisplayName(user);
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = `${user.company} - Plan ${user.plan || "Base"}`;
      info.appendChild(title);
      info.appendChild(note);

      const meta = document.createElement("div");
      meta.className = "list-meta";
      const metaEmail = document.createElement("p");
      metaEmail.className = "list-meta-line";
      metaEmail.textContent = `Email: ${user.email || "-"}`;
      const metaCommission = document.createElement("p");
      metaCommission.className = "list-meta-line";
      metaCommission.textContent = `Comision: ${user.commissionRate || 0}% + ${formatMoney(
        user.commissionFixed || 0
      )}`;
      const metaDeal = document.createElement("p");
      metaDeal.className = "list-meta-line";
      metaDeal.textContent = `MRR esperado: ${formatMoney(user.dealValue || 0)}`;
      const metaStage = document.createElement("p");
      metaStage.className = "list-meta-line";
      metaStage.textContent = `Etapa: ${getSalesStatusLabel(user.salesStatus)}`;
      info.appendChild(meta);
      meta.appendChild(metaEmail);
      meta.appendChild(metaCommission);
      meta.appendChild(metaDeal);
      meta.appendChild(metaStage);

      const actions = document.createElement("div");
      actions.className = "list-actions";
      const chip = document.createElement("span");
      const chipData = getSalesChip(user.salesStatus);
      chip.className = `chip ${chipData.className}`;
      chip.textContent = chipData.label;
      actions.appendChild(chip);
      const stageBtn = document.createElement("button");
      stageBtn.type = "button";
      stageBtn.className = "btn btn-ghost btn-xs";
      stageBtn.dataset.action = "stage";
      stageBtn.textContent = "Cambiar etapa";
      actions.appendChild(stageBtn);
      const infoBtn = document.createElement("button");
      infoBtn.type = "button";
      infoBtn.className = "btn btn-ghost btn-xs";
      infoBtn.dataset.action = "info";
      infoBtn.textContent = "Info";
      actions.appendChild(infoBtn);
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-ghost btn-xs";
      deleteBtn.dataset.action = "delete";
      deleteBtn.textContent = "Eliminar";
      actions.appendChild(deleteBtn);

      item.appendChild(info);
      item.appendChild(actions);
      sellerClientList.appendChild(item);
    });
  }

  function renderCommissionList() {
    if (!sellerCommissionList) {
      return;
    }
    const items = getSellerUsers();
    sellerCommissionList.innerHTML = "";

    const head = document.createElement("div");
    head.className = "table-row is-head";
    head.innerHTML = `
      <span>Cliente</span>
      <span>MRR</span>
      <span>Comision</span>
      <span>Estado</span>
    `;
    sellerCommissionList.appendChild(head);

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "list-item";
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = "Sin comisiones registradas";
      empty.appendChild(note);
      sellerCommissionList.appendChild(empty);
      return;
    }

    items.slice(0, 6).forEach((user) => {
      const row = document.createElement("div");
      row.className = "table-row";
      const commission = computeCommission(user);
      row.innerHTML = `
        <span class="table-cell table-strong">${user.company}</span>
        <span class="table-cell">${formatMoney(user.dealValue || 0)}</span>
        <span class="table-cell">${formatMoney(commission)}</span>
        <span class="table-cell">${getSalesStatusLabel(user.salesStatus)}</span>
      `;
      sellerCommissionList.appendChild(row);
    });
  }

  function renderMetrics() {
    const items = getSellerUsers();
    const totalClients = items.length;
    const totalMrr = items.reduce((sum, user) => sum + (Number(user.dealValue) || 0), 0);
    const totalCommission = items.reduce((sum, user) => sum + computeCommission(user), 0);
    const pipeline = items
      .filter((user) => user.salesStatus !== "cerrado")
      .reduce((sum, user) => sum + (Number(user.dealValue) || 0), 0);

    if (metricClients) {
      metricClients.textContent = totalClients;
    }
    if (metricMrr) {
      metricMrr.textContent = formatMoney(totalMrr);
    }
    if (metricCommission) {
      metricCommission.textContent = formatMoney(totalCommission);
    }
    if (metricPipeline) {
      metricPipeline.textContent = formatMoney(pipeline);
    }

    const closedCount = items.filter((user) => user.salesStatus === "cerrado").length;
    const conversion = totalClients ? Math.round((closedCount / totalClients) * 100) : 0;

    updateGoal(goalMrr, totalMrr, goalMrrLabel, goalMrrNote, true);
    updateGoal(goalClients, totalClients, goalClientsLabel, goalClientsNote, false);
    updateGoal(goalConversion, conversion, goalConversionLabel, goalConversionNote, false);
  }

  function updateGoal(element, value, label, note, isMoney) {
    if (!element) {
      return;
    }
    const goalValue = Number(element.dataset.goal) || 0;
    const percent = goalValue ? Math.min(100, Math.round((value / goalValue) * 100)) : 0;
    element.style.setProperty("--value", `${percent}%`);
    if (label) {
      if (isMoney) {
        label.textContent = `${formatMoney(value)} / ${formatMoney(goalValue)}`;
      } else {
        label.textContent = `${value} / ${goalValue}`;
      }
    }
    if (note) {
      note.textContent = `${percent}% del objetivo`;
    }
  }

  async function handleSellerSubmit(event) {
    event.preventDefault();
    if (!sellerForm) {
      return;
    }
    setStatus("", "");
    const data = new FormData(sellerForm);
    const email = String(data.get("email") || "").trim();
    if (!email) {
      setStatus("Ingresa un email valido.", "error");
      return;
    }
    const user = upsertSellerUser(data);
    if (!user) {
      setStatus("Ingresa un email valido.", "error");
      return;
    }
    N.audit?.log({
      type: "sales",
      title: "Cliente agregado por ventas",
      detail: `Cliente ${user.email} registrado con empresa ${user.company}.`,
      userId: user.id,
      companyId: user.companyId || "",
      actor: N.session?.user?.email || "",
    });
    if (N.data?.saveState) {
      await N.data.saveState();
    }
    sellerForm.reset();
    applyPhoneFormat();
    applyRutFormat();
    renderAll();
    setStatus(`Cliente guardado: ${user.company}.`, "success");
  }

  async function handleListAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }
    const listItem = button.closest("[data-user-id]");
    if (!listItem) {
      return;
    }
    const user = N.state.users.find((item) => item.id === listItem.dataset.userId);
    if (!user) {
      return;
    }
    const action = button.dataset.action;
    if (action === "info") {
      listItem.classList.toggle("is-open");
      return;
    }
    if (action === "stage") {
      const stages = ["prospecto", "en-seguimiento", "cerrado"];
      const currentIndex = stages.indexOf(user.salesStatus);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % stages.length;
      user.salesStatus = stages[nextIndex];
      N.audit?.log({
        type: "sales",
        title: "Etapa comercial actualizada",
        detail: `Cliente ${user.company} -> ${getSalesStatusLabel(user.salesStatus)}.`,
        userId: user.id,
        companyId: user.companyId || "",
        actor: N.session?.user?.email || "",
      });
    }
    if (action === "delete") {
      const confirmDelete = window.confirm(
        `Eliminar al cliente ${N.utils.buildUserDisplayName(user)}?`
      );
      if (!confirmDelete) {
        return;
      }
      N.state.users = N.state.users.filter((item) => item.id !== user.id);
      N.audit?.log({
        type: "sales",
        title: "Cliente eliminado",
        detail: `Cliente ${user.email} eliminado del pipeline.`,
        userId: user.id,
        companyId: user.companyId || "",
        actor: N.session?.user?.email || "",
      });
    }
    if (N.data?.saveState) {
      await N.data.saveState();
    }
    renderAll();
  }

  function renderAll() {
    renderClientList();
    renderCommissionList();
    renderMetrics();
  }

  function init() {
    if (sellerForm) {
      sellerForm.addEventListener("submit", handleSellerSubmit);
    }
    if (sellerClientList) {
      sellerClientList.addEventListener("click", handleListAction);
    }
    if (sellerSearch) {
      sellerSearch.addEventListener("input", renderAll);
    }
    if (phoneInput) {
      phoneInput.addEventListener("input", applyPhoneFormat);
      applyPhoneFormat();
    }
    if (rutInput) {
      rutInput.addEventListener("input", applyRutFormat);
      applyRutFormat();
    }
  }

  N.vendedor = {
    renderAll,
    init,
  };
})();
