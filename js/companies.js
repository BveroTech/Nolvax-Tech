(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  const companyForm = document.getElementById("company-form");
  const companyListRecent = document.getElementById("company-list-recent");
  const companyListFull = document.getElementById("company-list-full");
  const companySelect = document.getElementById("user-company");
  const subscriptionSelect = document.getElementById("subscription-company");
  const companyTaxInput = document.getElementById("company-tax");
  const companyStoreInput = document.getElementById("company-store-id");
  const companyFormStatus = document.getElementById("company-form-status");

  function setCompanyStatus(message, tone) {
    if (!companyFormStatus) {
      return;
    }
    companyFormStatus.textContent = message || "";
    companyFormStatus.classList.toggle("is-error", tone === "error");
    companyFormStatus.classList.toggle("is-success", tone === "success");
  }

  function applyRutFormat() {
    if (!companyTaxInput) {
      return "";
    }
    const formatted = N.utils.formatRutInput(companyTaxInput.value);
    companyTaxInput.value = formatted;
    return formatted;
  }

  function normalizeCompany(company) {
    if (!company || typeof company !== "object") {
      return company;
    }
    if (!company.modules) {
      company.modules = {
        pos: true,
        inventory: true,
        loyalty: true,
        sync: true,
        hardware: true,
        reports: true,
      };
    }
    if (!company.subscription) {
      company.subscription = {
        plan: company.plan || "Base",
        status: company.status || "active",
        renewAt: "",
        killSwitch: false,
      };
    }
    if (!company.supportTickets) {
      company.supportTickets = [];
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
    if (!company.products) {
      company.products = [];
    }
    if (!company.analytics) {
      company.analytics = {
        orders: 0,
        trendNote: "",
        updatedAt: "",
      };
    }
    return company;
  }

  function renderCompanyList(listElement, limit) {
    if (!listElement) {
      return;
    }

    listElement.innerHTML = "";
    const items =
      typeof limit === "number" ? N.state.companies.slice(0, limit) : N.state.companies;

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "list-item";
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = "Sin empresas";
      empty.appendChild(note);
      listElement.appendChild(empty);
      return;
    }

    items.forEach((company) => {
      normalizeCompany(company);
      const item = document.createElement("li");
      item.className = "list-item";

      const info = document.createElement("div");
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = company.name;
      const note = document.createElement("p");
      note.className = "list-note";
      const statusLabel = N.labels.companyStatus[company.status] || company.status;
      const storeId = company.storeId || company.id;
      note.textContent = `${company.plan} - ${statusLabel} - ${storeId || "store_id"}`;
      info.appendChild(title);
      info.appendChild(note);

      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = company.status === "active" ? "OK" : "Alerta";
      chip.classList.add(company.status === "active" ? "chip-live" : "chip-warn");

      item.appendChild(info);
      item.appendChild(chip);
      listElement.appendChild(item);
    });
  }

  function renderSelects() {
    const selects = [companySelect, subscriptionSelect];
    selects.forEach((select) => {
      if (!select) {
        return;
      }
      select.innerHTML = "";
      if (!N.state.companies.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Sin empresas";
        select.appendChild(option);
        return;
      }
      N.state.companies.forEach((company) => {
        normalizeCompany(company);
        const option = document.createElement("option");
        option.value = company.id;
        const storeId = company.storeId || company.id;
        option.textContent = storeId ? `${company.name} - ${storeId}` : company.name;
        select.appendChild(option);
      });
    });
  }

  function renderLists() {
    renderCompanyList(companyListRecent, 4);
    renderCompanyList(companyListFull);
  }

  async function handleCompanySubmit(event) {
    event.preventDefault();
    if (!companyForm) {
      return;
    }
    const data = new FormData(companyForm);

    const storeId = String(data.get("store_id") || "").trim();
    if (!storeId) {
      setCompanyStatus("Ingresa un store_id valido.", "error");
      return;
    }
    const exists = N.state.companies.find((item) => item.id === storeId);
    if (exists) {
      setCompanyStatus("El store_id ya existe. Usa otro.", "error");
      return;
    }

    const taxId = N.utils.formatRutInput(data.get("tax_id"));
    if (companyTaxInput) {
      companyTaxInput.value = taxId;
    }

    const company = {
      id: storeId,
      storeId,
      name: data.get("company_name").trim() || "Empresa sin nombre",
      legalName: data.get("legal_name") || "",
      taxId,
      country: data.get("country") || "",
      plan: data.get("plan"),
      status: data.get("status"),
      billing: data.get("billing_email") || "",
      notes: data.get("notes") || "",
      createdAt: new Date().toISOString(),
    };

    normalizeCompany(company);
    N.state.companies.unshift(company);
    if (N.data?.saveState) {
      await N.data.saveState();
    }
    companyForm.reset();
    setCompanyStatus("Empresa creada correctamente.", "success");
    renderSelects();
    renderLists();
    if (N.ui?.updateStats) {
      N.ui.updateStats();
    }
  }

  function init() {
    if (companyTaxInput) {
      companyTaxInput.addEventListener("input", applyRutFormat);
      applyRutFormat();
    }
    if (companyForm) {
      companyForm.addEventListener("submit", handleCompanySubmit);
    }
  }

  N.companies = {
    renderSelects,
    renderLists,
    init,
  };
})();
