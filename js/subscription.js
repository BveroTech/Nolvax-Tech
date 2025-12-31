(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  // Subscription control per company (plan, renew date, kill switch).

  const companySelect = document.getElementById("subscription-company");
  const planSelect = document.getElementById("subscription-plan");
  const renewInput = document.getElementById("subscription-renew");
  const killSwitch = document.getElementById("kill-switch");
  const subStatus = document.getElementById("sub-status");
  const saveButton = document.querySelector("#subscription-save");
  const blockButton = document.querySelector("#subscription-block");

  function ensureSubscription(company) {
    if (!company.subscription) {
      company.subscription = {
        plan: company.plan || "Base",
        status: company.status || "active",
        renewAt: "",
        killSwitch: false,
      };
    }
    return company.subscription;
  }

  function getSelectedCompany() {
    const id = companySelect?.value || "";
    if (!id) {
      return null;
    }
    return N.state.companies.find((company) => company.id === id) || null;
  }

  function setStatusChip(status, blocked) {
    if (!subStatus) {
      return;
    }
    const label = blocked ? "Bloqueado" : N.labels.companyStatus[status] || status;
    subStatus.textContent = label;
    subStatus.classList.toggle("chip-alert", blocked);
    subStatus.classList.toggle("chip-live", !blocked);
  }

  function loadCompany() {
    const company = getSelectedCompany();
    if (!company) {
      if (planSelect) {
        planSelect.value = "Base";
      }
      if (renewInput) {
        renewInput.value = "";
      }
      if (killSwitch) {
        killSwitch.checked = false;
      }
      setStatusChip("active", false);
      if (N.ui?.updateKillSwitch) {
        N.ui.updateKillSwitch();
      }
      return;
    }
    const subscription = ensureSubscription(company);
    if (planSelect) {
      planSelect.value = subscription.plan || company.plan || "Base";
    }
    if (renewInput) {
      renewInput.value = subscription.renewAt || "";
    }
    if (killSwitch) {
      killSwitch.checked = Boolean(subscription.killSwitch);
    }
    setStatusChip(subscription.status || company.status || "active", Boolean(subscription.killSwitch));
    if (N.ui?.updateKillSwitch) {
      N.ui.updateKillSwitch();
    }
  }

  async function saveSubscription(forceBlock = false) {
    const company = getSelectedCompany();
    if (!company) {
      return;
    }
    const subscription = ensureSubscription(company);
    const selectedPlan = planSelect?.value || subscription.plan || "Base";
    subscription.plan = selectedPlan;
    subscription.renewAt = renewInput?.value || "";
    subscription.killSwitch = forceBlock ? true : Boolean(killSwitch?.checked);
    subscription.status = subscription.killSwitch ? "blocked" : "active";
    subscription.updatedAt = new Date().toISOString();

    company.plan = selectedPlan;
    company.status = subscription.status;

    N.audit?.log({
      type: "subscription",
      title: "Suscripcion actualizada",
      detail: `Suscripcion ${company.name} -> ${subscription.status}.`,
      companyId: company.id,
      actor: N.session?.user?.email || "",
    });

    if (N.data?.saveState) {
      await N.data.saveState();
    }
    loadCompany();
  }

  function render() {
    if (companySelect) {
      companySelect.innerHTML = "";
      if (!N.state.companies.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Sin empresas";
        companySelect.appendChild(option);
      } else {
        N.state.companies.forEach((company) => {
          const option = document.createElement("option");
          option.value = company.id;
          const storeId = company.storeId || company.id;
          option.textContent = storeId ? `${company.name} - ${storeId}` : company.name;
          companySelect.appendChild(option);
        });
      }
    }
    loadCompany();
  }

  function init() {
    if (!companySelect) {
      return;
    }
    render();
    companySelect.addEventListener("change", loadCompany);
    if (saveButton) {
      saveButton.addEventListener("click", () => saveSubscription(false));
    }
    if (blockButton) {
      blockButton.addEventListener("click", () => saveSubscription(true));
    }
    if (killSwitch) {
      killSwitch.addEventListener("change", () => saveSubscription(false));
    }
  }

  N.subscription = {
    render,
    init,
  };
})();

