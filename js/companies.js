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

  function applyRutFormat() {
    if (!companyTaxInput) {
      return "";
    }
    const formatted = N.utils.formatRutInput(companyTaxInput.value);
    companyTaxInput.value = formatted;
    return formatted;
  }

  function renderCompanyList(listElement, limit) {
    if (!listElement) {
      return;
    }

    listElement.innerHTML = "";
    const items = typeof limit === "number" ? N.state.companies.slice(0, limit) : N.state.companies;

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
      const item = document.createElement("li");
      item.className = "list-item";

      const info = document.createElement("div");
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = company.name;
      const note = document.createElement("p");
      note.className = "list-note";
      const statusLabel = N.labels.companyStatus[company.status] || company.status;
      note.textContent = `${company.plan} - ${statusLabel}`;
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
        const option = document.createElement("option");
        option.value = company.id;
        option.textContent = company.name;
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

    const company = {
      id: `cmp_${Date.now()}`,
      name: data.get("company_name").trim() || "Empresa sin nombre",
      plan: data.get("plan"),
      status: data.get("status"),
      billing: data.get("billing_email") || "",
    };

    N.state.companies.unshift(company);
    if (N.data?.saveState) {
      await N.data.saveState();
    }
    companyForm.reset();
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
