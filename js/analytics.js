(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  // Analytics, product library, and onboarding templates for Admin Central.

  const analyticsForm = document.getElementById("analytics-form");
  const analyticsStatus = document.getElementById("analytics-status");
  const analyticsCompany = document.getElementById("analytics-company");
  const analyticsOrders = document.getElementById("analytics-orders");
  const analyticsTrend = document.getElementById("analytics-trend");
  const analyticsSave = document.getElementById("analytics-save");
  const statTotalSales = document.getElementById("analytics-total-sales");
  const statAvgTicket = document.getElementById("analytics-avg-ticket");
  const statTopProduct = document.getElementById("analytics-top-product");
  const statTrend = document.getElementById("analytics-trend-note");
  const companyProductList = document.getElementById("analytics-product-list");
  const globalTopList = document.getElementById("analytics-global-top");
  const categoryTable = document.getElementById("analytics-category-list");
  const regionTable = document.getElementById("analytics-region-list");
  const metricGlobalSales = document.getElementById("analytics-global-sales");
  const metricGlobalProducts = document.getElementById("analytics-global-products");
  const metricGlobalCategory = document.getElementById("analytics-global-category");
  const metricGlobalCompanies = document.getElementById("analytics-global-companies");

  const libraryForm = document.getElementById("library-product-form");
  const libraryStatus = document.getElementById("library-status");
  const libraryCompany = document.getElementById("library-company");
  const librarySearch = document.getElementById("library-search");
  const libraryList = document.getElementById("library-list");

  const templateForm = document.getElementById("template-form");
  const templateStatus = document.getElementById("template-status");
  const templateList = document.getElementById("template-list");
  const templateCompany = document.getElementById("template-company");
  const templateSelect = document.getElementById("template-select");
  const templateApply = document.getElementById("template-apply");
  const templateApplyStatus = document.getElementById("template-apply-status");

  function setStatus(element, message, tone) {
    if (!element) {
      return;
    }
    element.textContent = message || "";
    element.classList.toggle("is-error", tone === "error");
    element.classList.toggle("is-success", tone === "success");
  }

  function parseNumber(value) {
    const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function parseMoney(value) {
    return parseNumber(value);
  }

  function formatMoney(value) {
    try {
      return `CLP ${new Intl.NumberFormat("es-CL").format(value || 0)}`;
    } catch (_err) {
      return `CLP ${value || 0}`;
    }
  }

  function getMetaLibrary() {
    const meta = N.data?.getMeta ? N.data.getMeta() : N.state.meta;
    if (!meta.productLibrary) {
      meta.productLibrary = [];
    }
    return meta.productLibrary;
  }

  function getMetaTemplates() {
    const meta = N.data?.getMeta ? N.data.getMeta() : N.state.meta;
    if (!meta.productTemplates) {
      meta.productTemplates = [];
    }
    return meta.productTemplates;
  }

  function ensureCompany(company) {
    if (!company) {
      return null;
    }
    if (!Array.isArray(company.products)) {
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

  function getCompanyById(id) {
    const company = N.state.companies.find((item) => item.id === id);
    return ensureCompany(company);
  }

  function getSelectedCompany(select) {
    const id = select?.value || "";
    if (!id) {
      return null;
    }
    return getCompanyById(id);
  }

  function normalizeProduct(input) {
    const sku = String(input.sku || "").trim();
    return {
      id: input.id || `prd_${Date.now()}`,
      name: String(input.name || "").trim() || "Producto",
      sku,
      category: String(input.category || "").trim(),
      brand: String(input.brand || "").trim(),
      image: String(input.image || "").trim(),
      attributes: String(input.attributes || "").trim(),
      price: parseMoney(input.price),
      stock: parseNumber(input.stock),
      salesMonthly: parseNumber(input.salesMonthly),
      uniqueSku: Boolean(input.uniqueSku),
      isPromo: Boolean(input.isPromo),
      isExclusive: Boolean(input.isExclusive),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function upsertCompanyProduct(company, product) {
    const targetSku = String(product.sku || "").toLowerCase();
    let existing = null;
    if (targetSku) {
      existing = company.products.find(
        (item) => String(item.sku || "").toLowerCase() === targetSku
      );
    }
    if (!existing) {
      existing = company.products.find(
        (item) => String(item.name || "").toLowerCase() === product.name.toLowerCase()
      );
    }
    if (existing) {
      Object.assign(existing, product);
      return existing;
    }
    company.products.unshift(product);
    return product;
  }

  function shouldPromoteToLibrary(product) {
    return Boolean(product.uniqueSku && product.sku && !product.isPromo && !product.isExclusive);
  }

  function upsertLibraryProduct(product) {
    const library = getMetaLibrary();
    const targetSku = String(product.sku || "").toLowerCase();
    if (!targetSku) {
      return null;
    }
    const existing = library.find(
      (item) => String(item.sku || "").toLowerCase() === targetSku
    );
    if (existing) {
      Object.assign(existing, product);
      return existing;
    }
    library.unshift({ ...product });
    return product;
  }

  function renderCompanySelects() {
    const selects = [analyticsCompany, libraryCompany, templateCompany];
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
        const storeId = company.storeId || company.id;
        option.textContent = storeId ? `${company.name} - ${storeId}` : company.name;
        select.appendChild(option);
      });
    });
  }

  function renderTemplateSelect() {
    if (!templateSelect) {
      return;
    }
    templateSelect.innerHTML = "";
    const templates = getMetaTemplates();
    if (!templates.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Sin plantillas";
      templateSelect.appendChild(option);
      return;
    }
    templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = `${template.name} (${template.sector || "General"})`;
      templateSelect.appendChild(option);
    });
  }

  function computeCompanyMetrics(company) {
    const products = company?.products || [];
    const totalSales = products.reduce(
      (sum, item) => sum + (Number(item.salesMonthly) || 0) * (Number(item.price) || 0),
      0
    );
    const orders = Number(company?.analytics?.orders) || 0;
    const avgTicket = orders ? Math.round(totalSales / orders) : 0;
    const topProduct = products
      .slice()
      .sort((a, b) => (Number(b.salesMonthly) || 0) - (Number(a.salesMonthly) || 0))[0];
    return { totalSales, avgTicket, topProduct };
  }

  function renderCompanyAnalytics() {
    const company = getSelectedCompany(analyticsCompany);
    if (!company) {
      if (N.state.companies.length) {
        setStatus(analyticsStatus, "Selecciona una empresa.", "error");
      } else {
        setStatus(analyticsStatus, "", "");
      }
      if (analyticsOrders) {
        analyticsOrders.value = "";
      }
      if (analyticsTrend) {
        analyticsTrend.value = "";
      }
      if (statTotalSales) {
        statTotalSales.textContent = "CLP 0";
      }
      if (statAvgTicket) {
        statAvgTicket.textContent = "CLP 0";
      }
      if (statTopProduct) {
        statTopProduct.textContent = "-";
      }
      if (statTrend) {
        statTrend.textContent = "Sin tendencia";
      }
      renderCompanyProducts(null);
      return;
    }

    setStatus(analyticsStatus, "", "");
    if (analyticsOrders) {
      analyticsOrders.value = company.analytics?.orders || "";
    }
    if (analyticsTrend) {
      analyticsTrend.value = company.analytics?.trendNote || "";
    }

    const metrics = computeCompanyMetrics(company);
    if (statTotalSales) {
      statTotalSales.textContent = formatMoney(metrics.totalSales);
    }
    if (statAvgTicket) {
      statAvgTicket.textContent = formatMoney(metrics.avgTicket);
    }
    if (statTopProduct) {
      statTopProduct.textContent = metrics.topProduct
        ? `${metrics.topProduct.name} (${metrics.topProduct.sku || "sin SKU"})`
        : "-";
    }
    if (statTrend) {
      statTrend.textContent = company.analytics?.trendNote || "Sin tendencia";
    }
    renderCompanyProducts(company);
  }

  function renderCompanyProducts(company) {
    if (!companyProductList) {
      return;
    }
    companyProductList.innerHTML = "";
    const head = document.createElement("div");
    head.className = "table-row is-head";
    head.innerHTML =
      "<span>Producto</span><span>SKU</span><span>Categoria</span><span>Precio</span><span>Ventas</span>";
    companyProductList.appendChild(head);

    if (!company || !company.products.length) {
      const empty = document.createElement("div");
      empty.className = "list-item";
      empty.textContent = "Sin productos asociados.";
      companyProductList.appendChild(empty);
      return;
    }

    company.products.forEach((product) => {
      const row = document.createElement("div");
      row.className = "table-row";
      row.innerHTML = `
        <span class="table-cell table-strong">${product.name}</span>
        <span class="table-cell">${product.sku || "-"}</span>
        <span class="table-cell">${product.category || "-"}</span>
        <span class="table-cell">${formatMoney(product.price || 0)}</span>
        <span class="table-cell">${product.salesMonthly || 0}</span>
      `;
      companyProductList.appendChild(row);
    });
  }

  function renderGlobalAnalytics() {
    const allProducts = [];
    const categoryTotals = new Map();
    const regionTotals = new Map();
    let totalSales = 0;
    let companiesWithSales = 0;

    N.state.companies.forEach((company) => {
      ensureCompany(company);
      if (!company.products.length) {
        return;
      }
      companiesWithSales += 1;
      company.products.forEach((product) => {
        const sales = (Number(product.salesMonthly) || 0) * (Number(product.price) || 0);
        totalSales += sales;
        allProducts.push({ ...product, salesValue: sales });

        const category = String(product.category || "Sin categoria");
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + sales);
      });

      const region = String(company.country || "Sin pais");
      regionTotals.set(region, (regionTotals.get(region) || 0) + 1);
    });

    const topProducts = allProducts
      .slice()
      .sort((a, b) => (b.salesValue || 0) - (a.salesValue || 0))
      .slice(0, 6);

    if (globalTopList) {
      globalTopList.innerHTML = "";
      if (!topProducts.length) {
        const empty = document.createElement("li");
        empty.className = "list-item";
        empty.textContent = "Sin datos masivos.";
        globalTopList.appendChild(empty);
      } else {
        topProducts.forEach((product) => {
          const item = document.createElement("li");
          item.className = "list-item";
          const info = document.createElement("div");
          const title = document.createElement("p");
          title.className = "list-title";
          title.textContent = product.name;
          const note = document.createElement("p");
          note.className = "list-note";
          note.textContent = `SKU ${product.sku || "-"} - ${formatMoney(product.salesValue || 0)}`;
          info.appendChild(title);
          info.appendChild(note);
          item.appendChild(info);
          globalTopList.appendChild(item);
        });
      }
    }

    if (categoryTable) {
      categoryTable.innerHTML = "";
      const head = document.createElement("div");
      head.className = "table-row is-head";
      head.innerHTML = "<span>Categoria</span><span>Ventas</span>";
      categoryTable.appendChild(head);
      const rows = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
      if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "list-item";
        empty.textContent = "Sin categorias.";
        categoryTable.appendChild(empty);
      } else {
        rows.forEach(([category, value]) => {
          const row = document.createElement("div");
          row.className = "table-row";
          row.innerHTML = `
            <span class="table-cell table-strong">${category}</span>
            <span class="table-cell">${formatMoney(value)}</span>
          `;
          categoryTable.appendChild(row);
        });
      }
    }

    if (regionTable) {
      regionTable.innerHTML = "";
      const head = document.createElement("div");
      head.className = "table-row is-head";
      head.innerHTML = "<span>Region</span><span>Clientes</span>";
      regionTable.appendChild(head);
      const rows = Array.from(regionTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
      if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "list-item";
        empty.textContent = "Sin regiones.";
        regionTable.appendChild(empty);
      } else {
        rows.forEach(([region, count]) => {
          const row = document.createElement("div");
          row.className = "table-row";
          row.innerHTML = `
            <span class="table-cell table-strong">${region}</span>
            <span class="table-cell">${count}</span>
          `;
          regionTable.appendChild(row);
        });
      }
    }

    if (metricGlobalSales) {
      metricGlobalSales.textContent = formatMoney(totalSales);
    }
    if (metricGlobalProducts) {
      metricGlobalProducts.textContent = getMetaLibrary().length;
    }
    if (metricGlobalCompanies) {
      metricGlobalCompanies.textContent = companiesWithSales;
    }
    if (metricGlobalCategory) {
      const topCategory = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1])[0];
      metricGlobalCategory.textContent = topCategory ? topCategory[0] : "-";
    }
  }

  function renderLibraryList() {
    if (!libraryList) {
      return;
    }
    const term = (librarySearch?.value || "").trim().toLowerCase();
    const library = getMetaLibrary();
    const items = library.filter((product) => {
      if (!term) {
        return true;
      }
      const haystack = [product.name, product.sku, product.category].join(" ").toLowerCase();
      return haystack.includes(term);
    });

    libraryList.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "list-item";
      empty.textContent = "Sin productos en biblioteca.";
      libraryList.appendChild(empty);
      return;
    }

    items.forEach((product) => {
      const item = document.createElement("li");
      item.className = "list-item user-item";
      item.dataset.productId = product.id;
      item.dataset.productSku = product.sku || "";

      const info = document.createElement("div");
      info.className = "list-main";
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = product.name;
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = `SKU ${product.sku || "-"} - ${product.category || "Sin categoria"}`;
      info.appendChild(title);
      info.appendChild(note);

      const actions = document.createElement("div");
      actions.className = "list-actions";
      const assign = document.createElement("button");
      assign.type = "button";
      assign.className = "btn btn-ghost btn-xs";
      assign.dataset.action = "assign";
      assign.textContent = "Asignar";
      actions.appendChild(assign);

      item.appendChild(info);
      item.appendChild(actions);
      libraryList.appendChild(item);
    });
  }

  function renderTemplateList() {
    if (!templateList) {
      return;
    }
    templateList.innerHTML = "";
    const templates = getMetaTemplates();
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
      title.textContent = template.name;
      const note = document.createElement("p");
      note.className = "list-note";
      const skuCount = Array.isArray(template.skus) ? template.skus.length : 0;
      note.textContent = `${template.sector || "General"} - ${skuCount} SKU`;
      info.appendChild(title);
      info.appendChild(note);
      item.appendChild(info);
      templateList.appendChild(item);
    });
  }

  async function handleAnalyticsSave() {
    const company = getSelectedCompany(analyticsCompany);
    if (!company) {
      setStatus(analyticsStatus, "Selecciona una empresa valida.", "error");
      return;
    }
    company.analytics.orders = parseNumber(analyticsOrders?.value);
    company.analytics.trendNote = String(analyticsTrend?.value || "").trim();
    company.analytics.updatedAt = new Date().toISOString();

    N.audit?.log({
      type: "analytics",
      title: "Analitica actualizada",
      detail: `Analitica guardada para ${company.name}.`,
      companyId: company.id,
      actor: N.session?.user?.email || "",
    });

    if (N.data?.saveState) {
      await N.data.saveState();
    }
    setStatus(analyticsStatus, "Analitica actualizada.", "success");
    renderCompanyAnalytics();
    renderGlobalAnalytics();
  }

  async function handleLibrarySubmit(event) {
    event.preventDefault();
    if (!libraryForm) {
      return;
    }
    const company = getSelectedCompany(libraryCompany);
    if (!company) {
      setStatus(libraryStatus, "Selecciona una empresa valida.", "error");
      return;
    }

    const formData = new FormData(libraryForm);
    const product = normalizeProduct({
      name: formData.get("name"),
      sku: formData.get("sku"),
      category: formData.get("category"),
      brand: formData.get("brand"),
      image: formData.get("image"),
      attributes: formData.get("attributes"),
      price: formData.get("price"),
      stock: formData.get("stock"),
      salesMonthly: formData.get("sales"),
      uniqueSku: formData.get("unique_sku") === "on",
      isPromo: formData.get("promo") === "on",
      isExclusive: formData.get("exclusive") === "on",
    });

    if (product.uniqueSku && !product.sku) {
      setStatus(libraryStatus, "SKU unico requiere un codigo.", "error");
      return;
    }

    ensureCompany(company);
    upsertCompanyProduct(company, product);

    let libraryMessage = "Producto guardado solo en el cliente.";
    if (shouldPromoteToLibrary(product)) {
      upsertLibraryProduct(product);
      libraryMessage = "Producto agregado a biblioteca masiva.";
    }

    N.audit?.log({
      type: "library",
      title: "Producto guardado",
      detail: `Producto ${product.name} registrado en ${company.name}.`,
      companyId: company.id,
      actor: N.session?.user?.email || "",
    });

    if (N.data?.saveState) {
      await N.data.saveState();
    }

    libraryForm.reset();
    setStatus(libraryStatus, libraryMessage, "success");
    renderCompanyAnalytics();
    renderGlobalAnalytics();
    renderLibraryList();
    renderTemplateSelect();
  }

  async function handleLibraryAssign(event) {
    const button = event.target.closest("[data-action='assign']");
    if (!button) {
      return;
    }
    const item = button.closest("[data-product-id]");
    if (!item) {
      return;
    }
    const company = getSelectedCompany(libraryCompany);
    if (!company) {
      setStatus(libraryStatus, "Selecciona una empresa destino.", "error");
      return;
    }
    const productId = item.dataset.productId;
    const library = getMetaLibrary();
    const product = library.find((entry) => entry.id === productId);
    if (!product) {
      return;
    }
    const cloned = normalizeProduct({ ...product, id: `prd_${Date.now()}` });
    ensureCompany(company);
    upsertCompanyProduct(company, cloned);

    N.audit?.log({
      type: "library",
      title: "Producto asignado",
      detail: `Producto ${product.name} asignado a ${company.name}.`,
      companyId: company.id,
      actor: N.session?.user?.email || "",
    });

    if (N.data?.saveState) {
      await N.data.saveState();
    }
    setStatus(libraryStatus, `Producto asignado a ${company.name}.`, "success");
    renderCompanyAnalytics();
  }

  async function handleTemplateSubmit(event) {
    event.preventDefault();
    if (!templateForm) {
      return;
    }
    const data = new FormData(templateForm);
    const name = String(data.get("name") || "").trim();
    const sector = String(data.get("sector") || "").trim();
    const notes = String(data.get("notes") || "").trim();
    const skuRaw = String(data.get("skus") || "");
    const skus = skuRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!name) {
      setStatus(templateStatus, "Nombre requerido.", "error");
      return;
    }

    const templates = getMetaTemplates();
    templates.unshift({
      id: `tpl_${Date.now()}`,
      name,
      sector,
      notes,
      skus,
      createdAt: new Date().toISOString(),
    });

    N.audit?.log({
      type: "library",
      title: "Plantilla creada",
      detail: `Plantilla ${name} creada.`,
      actor: N.session?.user?.email || "",
    });

    if (N.data?.saveState) {
      await N.data.saveState();
    }

    templateForm.reset();
    setStatus(templateStatus, "Plantilla guardada.", "success");
    renderTemplateList();
    renderTemplateSelect();
  }

  async function handleTemplateApply() {
    const company = getSelectedCompany(templateCompany);
    if (!company) {
      setStatus(templateApplyStatus, "Selecciona una empresa.", "error");
      return;
    }
    const templateId = templateSelect?.value || "";
    const template = getMetaTemplates().find((item) => item.id === templateId);
    if (!template) {
      setStatus(templateApplyStatus, "Selecciona una plantilla valida.", "error");
      return;
    }

    const library = getMetaLibrary();
    const assigned = [];
    const skus = Array.isArray(template.skus) ? template.skus : [];
    skus.forEach((sku) => {
      const product = library.find(
        (entry) => String(entry.sku || "").toLowerCase() === sku.toLowerCase()
      );
      if (!product) {
        return;
      }
      const cloned = normalizeProduct({ ...product, id: `prd_${Date.now()}` });
      ensureCompany(company);
      upsertCompanyProduct(company, cloned);
      assigned.push(product.name);
    });

    if (!assigned.length) {
      setStatus(templateApplyStatus, "No se encontro ningun SKU en biblioteca.", "error");
      return;
    }

    N.audit?.log({
      type: "library",
      title: "Plantilla aplicada",
      detail: `Plantilla ${template.name} aplicada a ${company.name}.`,
      companyId: company.id,
      actor: N.session?.user?.email || "",
    });

    if (N.data?.saveState) {
      await N.data.saveState();
    }
    setStatus(
      templateApplyStatus,
      `Plantilla aplicada con ${assigned.length} productos.`,
      "success"
    );
    renderCompanyAnalytics();
  }

  function renderAll() {
    renderCompanySelects();
    renderTemplateSelect();
    renderCompanyAnalytics();
    renderGlobalAnalytics();
    renderLibraryList();
    renderTemplateList();
  }

  function init() {
    if (analyticsCompany) {
      analyticsCompany.addEventListener("change", renderCompanyAnalytics);
    }
    if (analyticsSave) {
      analyticsSave.addEventListener("click", handleAnalyticsSave);
    }
    if (libraryForm) {
      libraryForm.addEventListener("submit", handleLibrarySubmit);
    }
    if (librarySearch) {
      librarySearch.addEventListener("input", renderLibraryList);
    }
    if (libraryList) {
      libraryList.addEventListener("click", handleLibraryAssign);
    }
    if (templateForm) {
      templateForm.addEventListener("submit", handleTemplateSubmit);
    }
    if (templateApply) {
      templateApply.addEventListener("click", handleTemplateApply);
    }
    renderAll();
  }

  N.analytics = {
    renderAll,
    init,
  };
})();
