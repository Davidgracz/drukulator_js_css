(function () {
  "use strict";

  const VERSION = "0.3.0v — GitHub Pages";
  const C = window.Calculators;
  const content = document.getElementById("content");
  const navigation = document.getElementById("navigation");
  const cartPanel = document.getElementById("cartPanel");
  const toast = document.getElementById("toast");
  const sidebar = document.getElementById("sidebar");
  const downloadPricesButton = document.getElementById("downloadPrices");
  const PRICE_OVERRIDE_KEY = "drukulator_prices_override_0_3_0";
  const ADMIN_SESSION_KEY = "drukulator_admin_unlocked";
  const ADMIN_PASSWORD_HASH = "76ec9956";

  const state = {
    basePrices: null,
    prices: null,
    page: "Start",
    adminUnlocked: loadSessionFlag(ADMIN_SESSION_KEY),
    cart: loadJson("drukulator_cart", []),
    order: loadJson("drukulator_order", {
      name: "", email: "", phone: "", pickup: "Odbiór osobisty", notes: ""
    })
  };

  const pages = [
    ["Start", renderHome],
    ["Wizytówki", renderBusinessCards],
    ["Ulotki", renderFlyers],
    ["Folie i banery", renderBanners],
    ["Naklejki", renderStickers],
    ["Plakaty", renderPosters],
    ["Roll-up", renderRollup],
    ["PVC", renderPvc],
    ["Druk cyfrowy i ksero", renderDigital],
    ["Koszulki i odzież", renderApparel],
    ["Oprawa prac", renderBinding],
    ["Laminowanie", renderLamination],
    ["Obrazy na płótnie", renderCanvas],
    ["Edycja cen", renderPriceAdmin]
  ];

  document.getElementById("versionLabel").textContent = VERSION;
  document.getElementById("menuToggle").addEventListener("click", () => sidebar.classList.toggle("open"));
  downloadPricesButton.addEventListener("click", downloadPricesJson);

  boot();

  async function boot() {
    try {
      const response = await fetch("data/prices.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Błąd pobierania cennika: HTTP ${response.status}`);
      state.basePrices = await response.json();
      const savedPrices = loadJson(PRICE_OVERRIDE_KEY, null);
      state.prices = isValidPriceFile(savedPrices) ? savedPrices : deepClone(state.basePrices);
      if (savedPrices && !isValidPriceFile(savedPrices)) localStorage.removeItem(PRICE_OVERRIDE_KEY);
      downloadPricesButton.disabled = false;
      renderNavigation();
      renderCurrentPage();
      renderCart();
    } catch (error) {
      content.innerHTML = `${header("Błąd uruchomienia", "Nie udało się wczytać pliku cenowego.")}${alertBox(error.message + " Uruchom projekt przez GitHub Pages albo lokalny serwer HTTP, nie przez dwuklik index.html.", "error")}`;
    }
  }

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function loadSessionFlag(key) {
    try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
  }
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function isValidPriceFile(value) {
    return Boolean(value && typeof value === "object" && value.banery && value.naklejki && value.druk_cyfrowy_i_ksero);
  }
  function saveState() {
    try {
      localStorage.setItem("drukulator_cart", JSON.stringify(state.cart));
      localStorage.setItem("drukulator_order", JSON.stringify(state.order));
    } catch {
      // Kalkulator działa również wtedy, gdy przeglądarka blokuje pamięć lokalną.
    }
  }
  function money(value) {
    return Number(value).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function num(value, digits = 2) {
    return Number(value).toLocaleString("pl-PL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[ch]);
  }
  function options(values, selected) {
    return Array.from(values).map(v => `<option value="${esc(v)}"${String(v) === String(selected) ? " selected" : ""}>${esc(v)}</option>`).join("");
  }
  function header(title, subtitle = "Uzupełnij parametry i oblicz cenę brutto") {
    return `<header class="page-header"><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></header>`;
  }
  function alertBox(text, type = "info") { return `<div class="alert ${type}">${esc(text)}</div>`; }
  function value(id) { return document.getElementById(id).value; }
  function numberValue(id) { return Number(value(id)); }
  function showToast(message) {
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }
  function setResultError(error) {
    document.getElementById("quoteArea").innerHTML = alertBox(error.message || String(error), "error");
  }

  function renderNavigation() {
    navigation.innerHTML = pages.map(([name]) => `<button class="nav-button${name === state.page ? " active" : ""}${name === "Edycja cen" ? " admin-nav" : ""}" data-page="${esc(name)}">${esc(name)}</button>`).join("");
    navigation.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => {
      state.page = button.dataset.page;
      renderNavigation(); renderCurrentPage(); sidebar.classList.remove("open");
    }));
  }

  function renderCurrentPage() {
    const found = pages.find(([name]) => name === state.page);
    (found ? found[1] : renderHome)();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showQuote(quote) {
    const details = (quote.details || []).map(([label, val]) => `<div class="detail-row"><span>${esc(label)}</span><strong>${esc(val)}</strong></div>`).join("");
    document.getElementById("quoteArea").innerHTML = `
      <section class="quote-card">
        <h3>${esc(quote.title)}</h3>
        <div class="price-big">Cena brutto: ${money(quote.price)} zł</div>
        <p>${esc(quote.description)}</p>
        ${details ? `<div class="details">${details}</div>` : ""}
        <div class="actions"><button class="button full" id="addToCart">Dodaj do koszyka</button></div>
      </section>`;
    document.getElementById("addToCart").addEventListener("click", () => {
      state.cart.push({ ...quote, id: Date.now() + Math.random() });
      saveState(); renderCart(); showToast("Dodano do koszyka");
    });
  }

  function renderHome() {
    content.innerHTML = `${header("Kalkulator Druku", "Wersja statyczna działająca na GitHub Pages")}
      <div class="card">
        <p>Wybierz produkt z menu. Wszystkie obliczenia wykonywane są lokalnie w przeglądarce, na podstawie pliku <code>data/prices.json</code>.</p>
        <div class="metrics">
          <div class="metric"><span>Kalkulatory</span><strong>12</strong></div>
          <div class="metric"><span>Ceny</span><strong>Brutto</strong></div>
          <div class="metric"><span>Wersja</span><strong>${VERSION}</strong></div>
        </div>
        ${alertBox("Dane wpisywane do formularza zamówienia nie są wysyłane na serwer. Tekst jest tworzony wyłącznie w Twojej przeglądarce.", "info")}
      </div>`;
  }

  function renderPriceAdmin() {
    if (!state.adminUnlocked) {
      renderPriceAdminLogin();
      return;
    }

    const hasOverride = Boolean(loadJson(PRICE_OVERRIDE_KEY, null));
    content.innerHTML = `${header("Edycja cen", "Zmiany są stosowane natychmiast w tej przeglądarce")}
      <div class="card admin-toolbar">
        ${alertBox("Panel na GitHub Pages zapisuje ceny lokalnie. Aby opublikować je dla wszystkich, pobierz nowy prices.json i podmień plik data/prices.json w repozytorium.", "info")}
        <div class="admin-status-row">
          <span class="status-dot ${hasOverride ? "active" : ""}"></span>
          <strong id="adminPriceStatus">${hasOverride ? "Używane są ceny zapisane w tej przeglądarce" : "Używane są ceny z repozytorium"}</strong>
        </div>
        <div class="field admin-search"><label>Wyszukaj kategorię lub cenę</label><input id="adminSearch" type="search" placeholder="np. baner, A4, laminat, wizytówki"></div>
        <div class="actions admin-actions">
          <button class="button" id="saveAdminPrices" type="button">Zapisz i zastosuj</button>
          <button class="button secondary" id="downloadAdminPrices" type="button">Pobierz prices.json</button>
          <label class="button secondary admin-file-button">Wczytaj prices.json<input id="importAdminPrices" type="file" accept="application/json,.json"></label>
          <button class="button secondary" id="resetAdminPrices" type="button">Przywróć ceny z GitHub</button>
          <button class="button danger" id="lockAdmin" type="button">Zablokuj panel</button>
        </div>
      </div>
      <div id="adminMessage"></div>
      <div id="priceEditor" class="price-editor">${buildPriceEditor(state.prices)}</div>`;

    document.getElementById("adminSearch").addEventListener("input", event => filterPriceEditor(event.target.value));
    document.getElementById("saveAdminPrices").addEventListener("click", saveAdminPrices);
    document.getElementById("downloadAdminPrices").addEventListener("click", downloadPricesJson);
    document.getElementById("importAdminPrices").addEventListener("change", importAdminPrices);
    document.getElementById("resetAdminPrices").addEventListener("click", resetAdminPrices);
    document.getElementById("lockAdmin").addEventListener("click", lockPriceAdmin);
  }

  function renderPriceAdminLogin() {
    content.innerHTML = `${header("Edycja cen", "Panel administracyjny")}
      <div class="card admin-login-card">
        <form id="adminLoginForm">
          <div class="field"><label>Hasło</label><input id="adminPassword" type="password" autocomplete="current-password" required autofocus></div>
          <div class="actions"><button class="button full" type="submit">Otwórz edycję cen</button></div>
        </form>
        <div id="adminLoginMessage"></div>
        <p class="muted admin-security-note">To zabezpieczenie chroni panel przed przypadkową edycją. GitHub Pages jest stroną statyczną, więc nie zastępuje pełnego logowania serwerowego.</p>
      </div>`;

    document.getElementById("adminLoginForm").addEventListener("submit", async event => {
      event.preventDefault();
      const message = document.getElementById("adminLoginMessage");
      try {
        const passwordHash = hashPassword(value("adminPassword"));
        if (passwordHash !== ADMIN_PASSWORD_HASH) {
          message.innerHTML = alertBox("Nieprawidłowe hasło.", "error");
          document.getElementById("adminPassword").select();
          return;
        }
        state.adminUnlocked = true;
        try { sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); } catch {}
        renderPriceAdmin();
      } catch (error) {
        message.innerHTML = alertBox(error.message || String(error), "error");
      }
    });
  }

  function buildPriceEditor(prices) {
    const fields = [];
    collectNumericFields(prices, [], fields);
    const groups = new Map();
    fields.forEach(field => {
      const category = String(field.path[0]);
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(field);
    });

    return Array.from(groups.entries()).map(([category, categoryFields], index) => {
      const rows = categoryFields.map(field => {
        const contextParts = field.path.slice(1, -1).map((part, partIndex) => humanizePathPart(part, field.path[partIndex]));
        const label = humanizePathPart(field.path[field.path.length - 1], field.path[field.path.length - 2]);
        const pathJson = JSON.stringify(field.path);
        const searchText = `${categoryLabel(category)} ${contextParts.join(" ")} ${label}`.toLocaleLowerCase("pl-PL");
        return `<div class="admin-price-field" data-search="${esc(searchText)}">
          <label>${esc(label)}</label>
          <input type="number" step="0.01" data-price-path="${esc(pathJson)}" value="${esc(field.value)}">
          <small>${esc(contextParts.join(" / ") || categoryLabel(category))}</small>
        </div>`;
      }).join("");
      return `<details class="admin-category"${index === 0 ? " open" : ""}>
        <summary><span>${esc(categoryLabel(category))}</span><span class="admin-count">${categoryFields.length}</span></summary>
        <div class="admin-price-grid">${rows}</div>
      </details>`;
    }).join("");
  }

  function collectNumericFields(valueToCheck, path, result) {
    if (Array.isArray(valueToCheck)) {
      valueToCheck.forEach((item, index) => collectNumericFields(item, [...path, index], result));
      return;
    }
    if (valueToCheck && typeof valueToCheck === "object") {
      Object.entries(valueToCheck).forEach(([key, item]) => collectNumericFields(item, [...path, key], result));
      return;
    }
    if (typeof valueToCheck === "number" && Number.isFinite(valueToCheck)) result.push({ path, value: valueToCheck });
  }

  function categoryLabel(category) {
    const labels = {
      meta: "Ustawienia ogólne",
      banery: "Folie i banery",
      pvc: "Druk na PCV",
      wizytowki: "Wizytówki",
      papier_firmowy: "Papier firmowy",
      rollup: "Roll-up i X-baner",
      ulotki: "Ulotki",
      plakaty: "Plakaty",
      naklejki: "Naklejki i etykiety",
      druk_cyfrowy_i_ksero: "Druk cyfrowy i ksero",
      odziez_z_nadrukiem: "Koszulki i odzież",
      oprawa_prac: "Oprawa prac",
      laminowanie: "Laminowanie",
      obrazy_na_plotnie: "Obrazy na płótnie"
    };
    return labels[category] || humanizeText(category);
  }

  function humanizePathPart(part, parent) {
    if (typeof part === "number") {
      if (["progi_cenowe", "progi_cenowe_mb", "progi_cenowe_m2", "progi_ilosciowe"].includes(parent)) return `Próg ${part + 1}`;
      return `Pozycja ${part + 1}`;
    }
    const labels = {
      cena_m2: "Cena za m²",
      cena_mb: "Cena za mb",
      cena_sztuki: "Cena za sztukę",
      minimum_zamowienia: "Minimum zamówienia",
      minimum_m2: "Minimalna długość / powierzchnia",
      maks_m2: "Górna granica m²",
      maks_mb: "Górna granica mb",
      vat: "VAT [%]",
      folia_mikrony: "Grubość folii [µm]",
      maksymalny_bok_cm: "Maksymalny bok [cm]",
      od_10_sztuk: "Rabat od 10 sztuk [%]",
      powyzej_20_sztuk: "Rabat powyżej 20 sztuk [%]",
      cena_za_m2: "Cena za m²",
      cena_m2_obrazu: "Cena za m² obrazu",
      doplaty_do_papieru: "Dopłaty do papieru",
      mnozniki_formatu: "Mnożniki formatu",
      mnozniki_zadruku: "Mnożniki zadruku",
      progi_cenowe: "Progi cenowe",
      progi_cenowe_mb: "Progi cenowe mb",
      progi_cenowe_m2: "Progi cenowe m²",
      progi_ilosciowe: "Progi ilościowe",
      min_szt: "Od liczby sztuk",
      rabat_proc: "Rabat [%]",
      grubosci: "Grubości",
      formaty: "Formaty",
      rodzaje_opraw: "Rodzaje opraw",
      produkty: "Produkty",
      ceny: "Ceny"
    };
    return labels[part] || humanizeText(part);
  }

  function humanizeText(valueToFormat) {
    const text = String(valueToFormat).replaceAll("_", " ");
    return text.charAt(0).toLocaleUpperCase("pl-PL") + text.slice(1);
  }

  function filterPriceEditor(query) {
    const normalized = String(query || "").trim().toLocaleLowerCase("pl-PL");
    document.querySelectorAll(".admin-price-field").forEach(field => {
      field.classList.toggle("filtered-out", normalized && !field.dataset.search.includes(normalized));
    });
    document.querySelectorAll(".admin-category").forEach(category => {
      const visible = category.querySelector(".admin-price-field:not(.filtered-out)");
      category.classList.toggle("filtered-out", !visible);
      if (normalized && visible) category.open = true;
    });
  }

  function readPricesFromEditor() {
    const updatedPrices = deepClone(state.prices);
    document.querySelectorAll("[data-price-path]").forEach(input => {
      const parsed = Number(input.value);
      if (!Number.isFinite(parsed)) throw new Error(`Nieprawidłowa wartość w polu: ${input.closest(".admin-price-field").querySelector("label").textContent}`);
      setValueAtPath(updatedPrices, JSON.parse(input.dataset.pricePath), parsed);
    });
    return updatedPrices;
  }

  function setValueAtPath(target, path, newValue) {
    let current = target;
    for (let index = 0; index < path.length - 1; index += 1) current = current[path[index]];
    current[path[path.length - 1]] = newValue;
  }

  function saveAdminPrices() {
    const message = document.getElementById("adminMessage");
    try {
      state.prices = readPricesFromEditor();
      localStorage.setItem(PRICE_OVERRIDE_KEY, JSON.stringify(state.prices));
      document.getElementById("adminPriceStatus").textContent = "Używane są ceny zapisane w tej przeglądarce";
      document.querySelector(".status-dot").classList.add("active");
      message.innerHTML = alertBox("Ceny zostały zapisane i są już używane przez kalkulator.", "success");
      showToast("Zapisano ceny");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
    }
  }

  function downloadPricesJson() {
    if (!state.prices) return;
    const data = JSON.stringify(state.prices, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: "application/json;charset=utf-8" }));
    link.download = "prices.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importAdminPrices(event) {
    const file = event.target.files[0];
    if (!file) return;
    const message = document.getElementById("adminMessage");
    try {
      const imported = JSON.parse(await file.text());
      if (!isValidPriceFile(imported)) throw new Error("Wybrany plik nie ma prawidłowej struktury cennika.");
      state.prices = imported;
      localStorage.setItem(PRICE_OVERRIDE_KEY, JSON.stringify(state.prices));
      renderPriceAdmin();
      showToast("Wczytano prices.json");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
      event.target.value = "";
    }
  }

  function resetAdminPrices() {
    if (!window.confirm("Przywrócić ceny zapisane w pliku data/prices.json?")) return;
    localStorage.removeItem(PRICE_OVERRIDE_KEY);
    state.prices = deepClone(state.basePrices);
    renderPriceAdmin();
    showToast("Przywrócono ceny z GitHub");
  }

  function lockPriceAdmin() {
    state.adminUnlocked = false;
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch {}
    renderPriceAdmin();
  }

  function hashPassword(text) {
    let hash = 0x811c9dc5;
    const valueToHash = String(text);
    for (let index = 0; index < valueToHash.length; index += 1) {
      hash ^= valueToHash.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function renderBusinessCards() {
    const p = state.prices.wizytowki;
    content.innerHTML = `${header("Wizytówki")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Format</label><select id="bcFormat">${options(p.formaty)}</select></div>
      <div class="field half"><label>Rodzaj druku</label><select id="bcPrint">${options(["Cyfrowy", "Offsetowy"])}</select></div>
      <div class="field half"><label>Wykończenie</label><select id="bcFinish"></select></div>
      <div class="field half"><label>Zadruk</label><select id="bcSides"></select></div>
      <div class="field"><label>Nakład</label><select id="bcQuantity"></select></div>
    </div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const print = document.getElementById("bcPrint"), finish = document.getElementById("bcFinish"), sides = document.getElementById("bcSides"), qty = document.getElementById("bcQuantity");
    function refresh() {
      if (print.value === "Cyfrowy") {
        finish.innerHTML = options(Object.keys(C.DIGITAL_FINISH_KEYS)); sides.innerHTML = options(["Jednostronne", "Dwustronne"]); sides.disabled = false;
        qty.innerHTML = options(Object.keys(p.cyfrowe[C.DIGITAL_FINISH_KEYS[finish.value]]));
      } else {
        finish.innerHTML = options(Object.keys(C.OFFSET_FINISH_KEYS)); sides.innerHTML = options(["Dwustronne"]); sides.disabled = true;
        qty.innerHTML = options(Object.keys(p.offsetowe[C.OFFSET_FINISH_KEYS[finish.value]]));
      }
    }
    print.addEventListener("change", refresh); finish.addEventListener("change", () => {
      const root = print.value === "Cyfrowy" ? p.cyfrowe[C.DIGITAL_FINISH_KEYS[finish.value]] : p.offsetowe[C.OFFSET_FINISH_KEYS[finish.value]];
      qty.innerHTML = options(Object.keys(root));
    }); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const price = C.calculateBusinessCards(state.prices, print.value, finish.value, Number(qty.value), sides.value);
      showQuote({ title: "Wizytówki", description: `${value("bcFormat")}, druk ${print.value.toLowerCase()}, ${finish.value}, ${sides.value.toLowerCase()}, ${qty.value} szt.`, price, details: [["Format", value("bcFormat")], ["Nakład", `${qty.value} szt.`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderFlyers() {
    const root = state.prices.ulotki;
    content.innerHTML = `${header("Ulotki", "Papier 130 g, kolor dwustronny")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj druku</label><select id="flyPrint">${options(Object.keys(root))}</select></div>
      <div class="field half"><label>Rodzaj ulotki</label><select id="flyVariant"></select></div>
      <div class="field half"><label>Format</label><select id="flyFormat"></select></div>
      <div class="field half"><label>Nakład</label><select id="flyQuantity"></select></div>
    </div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const print = document.getElementById("flyPrint"), variant = document.getElementById("flyVariant"), format = document.getElementById("flyFormat"), qty = document.getElementById("flyQuantity");
    function refreshVariants() { variant.innerHTML = options(Object.keys(root[print.value])); refreshFormats(); }
    function refreshFormats() { format.innerHTML = options(Object.keys(root[print.value][variant.value])); refreshQty(); }
    function refreshQty() { qty.innerHTML = options(Object.keys(root[print.value][variant.value][format.value])); }
    print.addEventListener("change", refreshVariants); variant.addEventListener("change", refreshFormats); format.addEventListener("change", refreshQty); refreshVariants();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const price = C.calculateFlyers(state.prices, print.value, variant.value, format.value, Number(qty.value));
      showQuote({ title: "Ulotki", description: `${print.value}, ${variant.value}, format ${format.value}, ${qty.value} szt.`, price, details: [["Papier", "130 g"], ["Zadruk", "Kolor dwustronny"]] });
    } catch (e) { setResultError(e); } });
  }

  function renderBanners() {
    const root = state.prices.banery;
    content.innerHTML = `${header("Folie i banery")}<div class="card"><div class="form-grid">
      <div class="field"><label>Materiał</label><select id="bannerMaterial">${options(Object.keys(root))}</select></div>
      <div class="field third"><label>Szerokość [cm]</label><input id="bannerWidth" type="number" min="0.1" step="1" value="100"></div>
      <div class="field third"><label>Wysokość [cm]</label><input id="bannerHeight" type="number" min="0.1" step="1" value="200"></div>
      <div class="field third"><label>Ilość sztuk</label><input id="bannerQty" type="number" min="1" step="1" value="1"></div>
    </div><div id="bannerInfo"></div><details><summary>Progi cenowe materiału</summary><div id="tierTable"></div></details>
    <div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const material = document.getElementById("bannerMaterial");
    function refresh() {
      const data = root[material.value];
      document.getElementById("bannerInfo").innerHTML = data.oczka_w_standardzie ? alertBox("✓ Oczka w standardzie", "success") : "";
      const tiers = data.progi_cenowe || [];
      let previous = 0;
      document.getElementById("tierTable").innerHTML = `<table class="tier-table"><thead><tr><th>Powierzchnia</th><th>Cena</th></tr></thead><tbody>${tiers.map(t => {
        const label = t.maks_m2 == null ? `powyżej ${previous} m²` : previous === 0 ? `do ${t.maks_m2} m²` : `powyżej ${previous} do ${t.maks_m2} m²`;
        previous = t.maks_m2 ?? previous; return `<tr><td>${label}</td><td>${money(t.cena_m2)} zł/m²</td></tr>`;
      }).join("")}</tbody></table>`;
    }
    material.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateBanner(state.prices, numberValue("bannerWidth"), numberValue("bannerHeight"), numberValue("bannerQty"), material.value);
      showQuote({ title: material.value, description: `${material.value}, ${value("bannerWidth")} × ${value("bannerHeight")} cm, ${value("bannerQty")} szt.`, price: result.price, details: [["Łączna powierzchnia", `${num(result.totalArea)} m²`], ["Cena za m²", `${money(result.unitPrice)} zł`], ["Minimum zamówienia", `${money(result.minimumOrder)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderStickers() {
    const root = state.prices.naklejki;
    const products = [...Object.keys(root.powierzchniowe), ...Object.keys(root.taxi)];
    content.innerHTML = `${header("Naklejki i etykiety")}<div class="card"><div class="form-grid">
      <div class="field"><label>Rodzaj produktu</label><select id="stickProduct">${options(products)}</select></div>
      <div id="stickSurfaceFields" class="field" style="display:contents">
        <div class="field third"><label>Szerokość jednej sztuki [mm]</label><input id="stickWidth" type="number" min="0.1" step="1" value="100"></div>
        <div class="field third"><label>Wysokość jednej sztuki [mm]</label><input id="stickHeight" type="number" min="0.1" step="1" value="100"></div>
        <div class="field third"><label>Minimalna liczba naklejek</label><input id="stickQty" type="number" min="1" step="1" value="100"></div>
      </div>
      <div id="stickTaxiFields" class="field hidden"><label>Ilość kompletów / sztuk</label><input id="stickTaxiQty" type="number" min="1" step="1" value="1"></div>
    </div><div id="stickInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const product = document.getElementById("stickProduct");
    function refresh() {
      const surface = Object.prototype.hasOwnProperty.call(root.powierzchniowe, product.value);
      document.getElementById("stickSurfaceFields").classList.toggle("hidden", !surface);
      document.getElementById("stickTaxiFields").classList.toggle("hidden", surface);
      if (!surface) {
        document.getElementById("stickInfo").innerHTML = "";
        return;
      }

      const productData = root.powierzchniowe[product.value];
      const tiers = productData.progi_cenowe_mb || [];
      let previous = 0;
      const tierTable = tiers.length ? `<details><summary>Progi cenowe</summary><table class="tier-table"><thead><tr><th>Długość rozliczeniowa</th><th>Cena</th></tr></thead><tbody>${tiers.map(tier => {
        const label = tier.maks_mb == null
          ? `powyżej ${previous} mb`
          : previous === 0
            ? `do ${tier.maks_mb} mb`
            : `powyżej ${previous} do ${tier.maks_mb} mb`;
        previous = tier.maks_mb ?? previous;
        return `<tr><td>${label}</td><td>${money(tier.cena_mb)} zł/mb</td></tr>`;
      }).join("")}</tbody></table></details>` : "";

      document.getElementById("stickInfo").innerHTML =
        alertBox(`Minimalne zamówienie: ${num(productData.minimum_m2, 1)} mb. Szerokość folii: 1000 mm. Do wymiaru produkcyjnego dodawane są 3 mm.`, "info") +
        tierTable;
    }
    product.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const surface = Object.prototype.hasOwnProperty.call(root.powierzchniowe, product.value);
      const quantity = surface ? numberValue("stickQty") : numberValue("stickTaxiQty");
      const result = C.calculateStickers(state.prices, product.value, quantity, surface ? numberValue("stickWidth") : null, surface ? numberValue("stickHeight") : null);
      if (surface) {
        showQuote({ title: product.value, description: `${product.value}, ${value("stickWidth")} × ${value("stickHeight")} mm, minimum ${quantity} szt.`, price: result.price, details: [["Naklejek w rzędzie", result.stickersPerRow], ["Liczba rzędów", result.rows], ["Łącznie wykonanych naklejek", result.totalStickers], ["Dodatkowych naklejek", result.extraStickers], ["Długość przed zaokrągleniem", `${num(result.baseLengthM, 3)} mb`], ["Długość rozliczeniowa", `${num(result.billedLengthM, 1)} mb`], ["Cena za mb", `${money(result.pricePerLinearMeter)} zł`], ["Wymiar produkcyjny", `${num(result.productionWidthMm, 1)} × ${num(result.productionHeightMm, 1)} mm`]] });
      } else showQuote({ title: product.value, description: `${product.value}, ${quantity} szt./kompletów`, price: result.price, details: [["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderPosters() {
    const root = state.prices.plakaty;
    content.innerHTML = `${header("Plakaty")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj druku</label><select id="posterPrint">${options(Object.keys(root))}</select></div>
      <div class="field half"><label>Format</label><select id="posterFormat"></select></div>
      <div class="field"><label id="posterQtyLabel">Nakład</label><span id="posterQtyWrap"></span></div>
    </div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const print = document.getElementById("posterPrint"), format = document.getElementById("posterFormat"), wrap = document.getElementById("posterQtyWrap");
    function refreshFormats() { format.innerHTML = options(Object.keys(root[print.value])); refreshQty(); }
    function refreshQty() {
      if (print.value === "Wielkoformatowy") wrap.innerHTML = `<input id="posterQty" type="number" min="1" step="1" value="1">`;
      else wrap.innerHTML = `<select id="posterQty">${options(Object.keys(root[print.value][format.value]))}</select>`;
    }
    print.addEventListener("change", refreshFormats); format.addEventListener("change", refreshQty); refreshFormats();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const q = numberValue("posterQty"), price = C.calculatePosters(state.prices, print.value, format.value, q);
      const paper = print.value === "Wielkoformatowy" ? "Papier satynowy 135 g" : "Papier 170 g, kolor jednostronny";
      showQuote({ title: "Plakaty", description: `${print.value}, format ${format.value}, ${q} szt.`, price, details: [["Materiał", paper]] });
    } catch (e) { setResultError(e); } });
  }

  function renderRollup() {
    const root = state.prices.rollup;
    content.innerHTML = `${header("Roll-up i X-bannery")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj produktu</label><select id="rollProduct">${options(Object.keys(root))}</select></div>
      <div class="field half"><label>Szerokość / format</label><select id="rollSize"></select></div>
      <div class="field"><label>Ilość sztuk</label><input id="rollQty" type="number" min="1" step="1" value="1"></div>
    </div><div id="rollInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const product = document.getElementById("rollProduct"), size = document.getElementById("rollSize");
    function refresh() {
      const productData = root[product.value];
      size.innerHTML = options(Object.keys(productData));
      const firstVariant = Object.values(productData)[0];
      const tierHeaders = [...firstVariant.progi_ilosciowe].sort((a, b) => Number(a.min_szt) - Number(b.min_szt));
      const rows = Object.entries(productData).map(([format, data]) => {
        const tiers = [...data.progi_ilosciowe].sort((a, b) => Number(a.min_szt) - Number(b.min_szt));
        return `<tr><td>${esc(format)}</td>${tiers.map(tier => `<td>${money(tier.cena_sztuki)} zł</td>`).join("")}</tr>`;
      }).join("");
      const headings = tierHeaders.map((tier, index) => {
        if (index === 0 && Number(tier.min_szt) === 1) return "1 szt.";
        const next = tierHeaders[index + 1];
        return next ? `${tier.min_szt}–${Number(next.min_szt) - 1} szt.` : `Od ${tier.min_szt} szt.`;
      });
      const note = product.value === "X-baner" ? "Format jest określony w wybranym wariancie." : "Wysokość roll-upu i wkładu: 200 cm.";
      document.getElementById("rollInfo").innerHTML = `${alertBox(note, "info")}<details><summary>Cennik brutto za sztukę</summary><table class="tier-table"><thead><tr><th>Format</th>${headings.map(label => `<th>${esc(label)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></details>`;
    }
    product.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const quantity = numberValue("rollQty");
      const result = C.calculateRollup(state.prices, product.value, size.value, quantity);
      const tierLabel = result.tierMinQuantity >= 5 ? "Od 5 sztuk" : result.tierMinQuantity >= 2 ? "2–4 sztuki" : "1 sztuka";
      showQuote({ title: product.value, description: `${product.value}, ${size.value}, ${quantity} szt.`, price: result.price, details: [["Próg ilościowy", tierLabel], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderPvc() {
    const root = state.prices.pvc;
    content.innerHTML = `${header("Folia z nadrukiem + PCV")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj produktu</label><select id="pvcProduct">${options(Object.keys(root))}</select></div>
      <div class="field half"><label>Grubość płyty</label><select id="pvcThickness"></select></div>
      <div class="field third"><label>Szerokość jednej sztuki [cm]</label><input id="pvcWidth" type="number" min="0.1" step="1" value="100"></div>
      <div class="field third"><label>Wysokość jednej sztuki [cm]</label><input id="pvcHeight" type="number" min="0.1" step="1" value="50"></div>
      <div class="field third"><label>Ilość sztuk</label><input id="pvcQty" type="number" min="1" step="1" value="1"></div>
    </div><div id="pvcInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const product = document.getElementById("pvcProduct"), thickness = document.getElementById("pvcThickness");
    function refreshInfo() {
      const tiers = root[product.value].grubosci[thickness.value].progi_cenowe_m2;
      const rows = tiers.map((tier, index) => {
        const range = index === 0 ? "Poniżej 2 m²" : tier.maks_m2 == null ? "Powyżej 5 m²" : "Od 2 do 5 m²";
        return `<tr><td>${range}</td><td>${money(tier.cena_m2)} zł/m²</td></tr>`;
      }).join("");
      document.getElementById("pvcInfo").innerHTML = `<details><summary>Cennik dla grubości ${esc(thickness.value)}</summary><table class="tier-table"><tbody>${rows}</tbody></table></details>`;
    }
    function refresh() { thickness.innerHTML = options(Object.keys(root[product.value].grubosci)); refreshInfo(); }
    product.addEventListener("change", refresh); thickness.addEventListener("change", refreshInfo); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculatePvc(state.prices, numberValue("pvcWidth"), numberValue("pvcHeight"), numberValue("pvcQty"), product.value, thickness.value);
      showQuote({ title: "Folia z nadrukiem + PCV", description: `${product.value}, płyta ${thickness.value}, ${value("pvcWidth")} × ${value("pvcHeight")} cm, ${value("pvcQty")} szt.`, price: result.price, details: [["Łączna powierzchnia", `${num(result.totalArea)} m²`], ["Cena za m²", `${money(result.unitPrice)} zł`], ["Minimum zamówienia", `${money(result.minimumOrder)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderDigital() {
    const root = state.prices.druk_cyfrowy_i_ksero;
    const services = ["Druk cyfrowy", "Ksero i druk", "Ksero książki", "Dla studentów", "Skanowanie"];
    content.innerHTML = `${header("Druk cyfrowy, ksero i skanowanie")}<div class="card"><div class="form-grid">
      <div class="field"><label>Rodzaj usługi</label><select id="digService">${options(services)}</select></div>
      <div id="digitalDynamic" class="field" style="display:contents"></div>
    </div><div id="digitalInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const service = document.getElementById("digService"), dynamic = document.getElementById("digitalDynamic");
    const standardPapers = ["Standardowy 80 g", "Papier kredowy 130 g", "Papier kredowy 170 g", "Papier kredowy 250 g", "Papier kredowy 300 g", "Papier kredowy 350 g"];
    const blackPapers = ["Standardowy 80 g", "Papier kolorowy", "Papier etykietowy", ...standardPapers.slice(1)];
    function refresh() {
      let html = "", note = "";
      if (service.value === "Druk cyfrowy") {
        html = `<div class="field half"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.druk_cyfrowy))}</select></div><div class="field half"><label>Format</label><select id="digFormat">${options(Object.keys(root.mnozniki_formatu))}</select></div><div class="field half"><label>Zadruk</label><select id="digSide">${options(Object.keys(root.mnozniki_zadruku))}</select></div><div class="field half"><label>Rodzaj papieru</label><select id="digPaper"></select></div><div class="field"><label>Liczba arkuszy</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Druk dwustronny: cena druku × 2. Koszt papieru jest doliczany tylko raz.";
      } else if (service.value === "Ksero i druk") {
        html = `<div class="field half"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.ksero_i_druk))}</select></div><div class="field half"><label>Format</label><select id="digFormat">${options(Object.keys(root.mnozniki_formatu))}</select></div><div class="field"><label>Rodzaj papieru</label><select id="digPaper">${options(standardPapers)}</select></div><div class="field"><label>Liczba kopii</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Format A3 kosztuje 2 razy więcej niż format A4.";
      } else if (service.value === "Ksero książki") {
        html = `<div class="field"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.ksero_ksiazki))}</select></div><div class="field"><label>Liczba stron</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Cena jest naliczana za każdą kopiowaną stronę.";
      } else if (service.value === "Dla studentów") {
        html = `<div class="field half"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.dla_studentow))}</select></div><div class="field half"><label>Format</label><select id="digFormat"></select></div><div class="field"><label>Liczba kopii</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Cennik studencki nie dotyczy kopiowania książek.";
      } else {
        html = `<div class="field"><label>Rodzaj skanowania</label><select id="digColor">${options(Object.keys(root.skanowanie))}</select></div><div class="field"><label>Liczba skanowanych stron</label><input id="digQty" type="number" min="1" step="1" value="1"></div>`;
        note = "Cena jest taka sama dla skanów czarno-białych i kolorowych.";
      }
      dynamic.innerHTML = html; document.getElementById("digitalInfo").innerHTML = alertBox(note, "info");
      if (service.value === "Druk cyfrowy") {
        const color = document.getElementById("digColor"), paper = document.getElementById("digPaper");
        function setPaper() { paper.innerHTML = options(color.value === "Czarno-biały" ? blackPapers : standardPapers); }
        color.addEventListener("change", setPaper); setPaper();
      }
      if (service.value === "Dla studentów") {
        const color = document.getElementById("digColor"), format = document.getElementById("digFormat");
        function setFormats() { format.innerHTML = options(Object.keys(root.dla_studentow[color.value])); }
        color.addEventListener("change", setFormats); setFormats();
      }
    }
    service.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const s = service.value, color = value("digColor"), q = numberValue("digQty");
      const format = document.getElementById("digFormat")?.value || "A4", paper = document.getElementById("digPaper")?.value || "Standardowy 80 g", side = document.getElementById("digSide")?.value || "Jednostronny";
      const result = C.calculateDigital(state.prices, s, color, q, format, paper, side);
      const details = [["Rodzaj usługi", s], ["Wariant", color], ["Ilość", q]];
      if (document.getElementById("digFormat")) details.push(["Format", format]);
      if (document.getElementById("digSide")) details.push(["Zadruk", side]);
      if (document.getElementById("digPaper")) details.push(["Papier", paper]);
      if (result.tier) details.push(["Próg cenowy", result.tier]);
      showQuote({ title: s, description: `${s}, ${color}, ${q} szt./stron`, price: result.price, details });
    } catch (e) { setResultError(e); } });
  }

  function renderApparel() {
    const root = state.prices.odziez_z_nadrukiem, products = root.produkty;
    content.innerHTML = `${header("Koszulki i odzież z nadrukiem")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Kategoria produktu</label><select id="appCategory">${options(Object.keys(products))}</select></div>
      <div class="field half"><label>Model</label><select id="appProduct"></select></div>
      <div class="field half"><label>Rozmiar nadruku z przodu</label><select id="appFront"></select></div>
      <div class="field half"><label>Rozmiar nadruku z tyłu</label><select id="appBack"></select></div>
      <div class="field"><label>Ilość sztuk</label><input id="appQty" type="number" min="1" step="1" value="1"></div>
    </div><div id="appInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const category = document.getElementById("appCategory"), product = document.getElementById("appProduct"), front = document.getElementById("appFront"), back = document.getElementById("appBack");
    function refreshProducts() { product.innerHTML = options(Object.keys(products[category.value])); refreshPrints(); }
    function refreshPrints() {
      const data = products[category.value][product.value], values = [C.NO_PRINT, ...Object.keys(data.ceny)];
      front.innerHTML = options(values); back.innerHTML = options(values);
      const discountRows = (root.rabaty.progi_ilosciowe || []).map(tier => `<tr><td>Od ${tier.min_szt} szt.</td><td>${tier.rabat_proc}%</td></tr>`).join("");
      document.getElementById("appInfo").innerHTML = `${data.opis ? alertBox(data.opis, "info") : ""}<details><summary>Rabaty ilościowe</summary><table class="tier-table"><tbody>${discountRows}</tbody></table></details>`;
    }
    category.addEventListener("change", refreshProducts); product.addEventListener("change", refreshPrints); refreshProducts();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateApparel(state.prices, category.value, product.value, front.value, back.value, numberValue("appQty"));
      const baseLabel = category.value === "Sam nadruk" ? "Cena pierwszego nadruku" : "Cena bazowa za sztukę";
      const details = [[baseLabel, `${money(result.baseUnitPrice)} zł`], ["Dopłata za drugi nadruk", `${money(result.extraPrintPrice)} zł`], ["Cena jednostkowa przed rabatem", `${money(result.unitPrice)} zł`], ["Wartość przed rabatem", `${money(result.priceBeforeDiscount)} zł`], ["Rabat", `${num(result.discountPercent, 0)}% = ${money(result.discountAmount)} zł`]];
      if (result.extraPrintMatchedSize) details.push(["Drugi nadruk rozliczony jako", result.extraPrintMatchedSize]);
      showQuote({ title: product.value, description: `${category.value} — ${product.value}, przód: ${front.value}, tył: ${back.value}, ${value("appQty")} szt.`, price: result.price, details });
    } catch (e) { setResultError(e); } });
  }

  function renderBinding() {
    const bindings = state.prices.oprawa_prac.rodzaje_opraw, digital = state.prices.druk_cyfrowy_i_ksero.druk_cyfrowy;
    content.innerHTML = `${header("Druk i oprawa prac", "Druk cyfrowy A4 oraz oprawa dokumentu")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Tryb druku</label><select id="bindColor">${options(Object.keys(digital))}</select></div>
      <div class="field half"><label>Sposób zadruku</label><select id="bindSide">${options(["Jednostronny", "Dwustronny"])}</select></div>
      <div class="field half"><label>Liczba stron jednego dokumentu</label><input id="bindPages" type="number" min="1" step="1" value="80"></div>
      <div class="field half"><label>Liczba egzemplarzy</label><input id="bindCopies" type="number" min="1" step="1" value="1"></div>
      <div class="field half"><label>Rodzaj oprawy</label><select id="bindType">${options(Object.keys(bindings))}</select></div>
      <div class="field half"><label>Rozmiar oprawy / spirali</label><select id="bindVariant"></select></div>
    </div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const type = document.getElementById("bindType"), variant = document.getElementById("bindVariant");
    function refresh() { variant.innerHTML = options(Object.keys(bindings[type.value])); }
    type.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateWorkBinding(state.prices, numberValue("bindPages"), numberValue("bindCopies"), value("bindColor"), value("bindSide"), type.value, variant.value);
      showQuote({ title: "Druk i oprawa prac", description: `${value("bindCopies")} egz., po ${value("bindPages")} stron, ${value("bindColor")}, ${value("bindSide").toLowerCase()}, ${type.value} ${variant.value}`, price: result.price, details: [["Łączna liczba drukowanych stron", result.totalPrintedPages], ["Łączna liczba arkuszy", result.totalSheets], ["Próg cenowy druku", result.tier], ["Koszt druku", `${money(result.printTotal)} zł`], ["Koszt opraw", `${money(result.bindingTotal)} zł`], ["Cena jednego egzemplarza", `${money(result.pricePerCopy)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderLamination() {
    const root = state.prices.laminowanie;
    content.innerHTML = `${header("Laminowanie", `Laminowanie dokumentów folią ${root.folia_mikrony || 80} mikronów`)}<div class="card"><div class="form-grid">
      <div class="field half"><label>Format dokumentu</label><select id="lamFormat">${options(Object.keys(root.formaty))}</select></div>
      <div class="field half"><label>Ilość sztuk</label><input id="lamQty" type="number" min="1" step="1" value="1"></div>
    </div><details><summary>Cennik brutto</summary><table class="tier-table"><tbody>${Object.entries(root.formaty).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${money(v)} zł/szt.</td></tr>`).join("")}</tbody></table></details><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateLamination(state.prices, value("lamFormat"), numberValue("lamQty"));
      showQuote({ title: "Laminowanie", description: `Format ${value("lamFormat")}, ${value("lamQty")} szt., folia ${result.foilMicrons} µm`, price: result.price, details: [["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderCanvas() {
    const root = state.prices.obrazy_na_plotnie;
    content.innerHTML = `${header("Obrazy na płótnie", `${root.material || "Płótno"}; zakres boków: ${root.minimalny_bok_cm || 30}–${root.maksymalny_bok_cm || 150} cm`)}<div class="card"><div class="form-grid">
      <div class="field half"><label>Sposób wyboru rozmiaru</label><select id="canvasMode">${options(["Wybierz format z cennika", "Wpisz własny wymiar", "Dopasuj do zdjęcia"])}</select></div>
      <div class="field half"><label>Ilość obrazów</label><input id="canvasQty" type="number" min="1" step="1" value="1"></div>
      <div id="canvasDynamic" class="field" style="display:contents"></div>
    </div><div id="canvasMessage"></div><div class="actions"><button class="button" id="calculateCanvas">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;

    const mode = document.getElementById("canvasMode");
    const dynamic = document.getElementById("canvasDynamic");
    const message = document.getElementById("canvasMessage");
    let imageInfo = null;

    function standardFormatOptions() {
      return Object.entries(root.formaty).map(([formatKey, price]) => `<option value="${esc(formatKey)}">${esc(formatKey.replace("x", " × "))} cm — ${money(price)} zł/szt.</option>`).join("");
    }

    function renderImageSizeOptions() {
      const holder = document.getElementById("canvasImageOptions");
      if (!holder || !imageInfo) return;
      const sizeMode = document.getElementById("canvasImageSizeMode").value;
      if (sizeMode === "Proponowane formaty") {
        const suggestions = C.getCanvasSuggestions(state.prices, imageInfo.width, imageInfo.height);
        imageInfo.suggestions = suggestions;
        holder.innerHTML = `<div class="field"><label>Proponowany format</label><select id="canvasSuggestion">${suggestions.map((item, index) => `<option value="${index}">${item.displayWidthCm} × ${item.displayHeightCm} cm — ${money(item.price)} zł/szt. — różnica proporcji ${num(item.ratioErrorPercent, 2)}%</option>`).join("")}</select></div>`;
        message.innerHTML = "";
      } else {
        holder.innerHTML = `<div class="field half"><label>Który bok podajesz?</label><select id="canvasKnownSide">${options(["Szerokość", "Wysokość"])}</select></div><div class="field half"><label>Wartość boku [cm]</label><input id="canvasKnownValue" type="number" min="0.1" step="0.1" value="60"></div>`;
        const updateProportionalSize = () => {
          try {
            const result = C.calculateProportionalCanvasSize(state.prices, imageInfo.width, imageInfo.height, value("canvasKnownSide"), numberValue("canvasKnownValue"));
            message.innerHTML = alertBox(`Rozmiar z zachowaniem proporcji: ${num(result.widthCm, 1)} × ${num(result.heightCm, 1)} cm`, "success");
          } catch (error) {
            message.innerHTML = alertBox(error.message, "warning");
          }
        };
        document.getElementById("canvasKnownSide").addEventListener("change", updateProportionalSize);
        document.getElementById("canvasKnownValue").addEventListener("input", updateProportionalSize);
        updateProportionalSize();
      }
    }

    function handleCanvasFile(event) {
      const file = event.target.files[0];
      imageInfo = null;
      message.innerHTML = "";
      const workspace = document.getElementById("canvasImageWorkspace");
      if (!file) {
        workspace.innerHTML = alertBox("Wybierz zdjęcie, aby dopasować format.", "info");
        return;
      }
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        imageInfo = { file, url, width: image.naturalWidth, height: image.naturalHeight, suggestions: [] };
        workspace.innerHTML = `<img class="image-preview" src="${url}" alt="Podgląd"><p class="muted">${esc(file.name)} — ${image.naturalWidth} × ${image.naturalHeight} px</p><div class="field"><label>Dopasowanie rozmiaru</label><select id="canvasImageSizeMode">${options(["Proponowane formaty", "Podaj jeden bok"])}</select></div><div id="canvasImageOptions" class="form-grid"></div>`;
        document.getElementById("canvasImageSizeMode").addEventListener("change", renderImageSizeOptions);
        renderImageSizeOptions();
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        workspace.innerHTML = alertBox("Nie można odczytać tego pliku obrazu.", "error");
      };
      image.src = url;
    }

    function refresh() {
      imageInfo = null;
      message.innerHTML = "";
      if (mode.value === "Wybierz format z cennika") {
        dynamic.innerHTML = `<div class="field"><label>Format obrazu</label><select id="canvasFormat">${standardFormatOptions()}</select></div>`;
      } else if (mode.value === "Wpisz własny wymiar") {
        dynamic.innerHTML = `<div class="field half"><label>Szerokość [cm]</label><input id="canvasWidth" type="number" min="${root.minimalny_bok_cm || 30}" max="${root.maksymalny_bok_cm || 150}" step="0.1" value="60"></div><div class="field half"><label>Wysokość [cm]</label><input id="canvasHeight" type="number" min="${root.minimalny_bok_cm || 30}" max="${root.maksymalny_bok_cm || 150}" step="0.1" value="90"></div>`;
        message.innerHTML = alertBox("Własny wymiar jest rozliczany według najbliższego większego formatu z cennika.", "info");
      } else {
        dynamic.innerHTML = `<div class="field"><label>Wybierz plik JPG / PNG / WebP</label><input id="canvasFile" type="file" accept="image/jpeg,image/png,image/webp,image/tiff"></div><div id="canvasImageWorkspace" class="field">${alertBox("Wybierz zdjęcie, aby dopasować format.", "info")}</div>`;
        document.getElementById("canvasFile").addEventListener("change", handleCanvasFile);
      }
    }

    mode.addEventListener("change", refresh);
    refresh();

    document.getElementById("calculateCanvas").addEventListener("click", () => {
      try {
        const quantity = numberValue("canvasQty");
        if (mode.value === "Wybierz format z cennika") {
          const formatKey = value("canvasFormat");
          const result = C.calculateCanvasStandard(state.prices, formatKey, quantity);
          const [width, height] = formatKey.split("x");
          showQuote({ title: "Obrazy na płótnie", description: `${width} × ${height} cm, ${quantity} szt.`, price: result.price, details: [["Format cennikowy", formatKey], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
          return;
        }
        if (mode.value === "Wpisz własny wymiar") {
          const width = numberValue("canvasWidth");
          const height = numberValue("canvasHeight");
          const result = C.calculateCanvasCustom(state.prices, width, height, quantity);
          showQuote({ title: "Obrazy na płótnie", description: `${num(width, 1)} × ${num(height, 1)} cm, ${quantity} szt.`, price: result.price, details: [["Format rozliczeniowy", result.billing.formatKey], ["Wymiar rozliczeniowy", `${result.billing.displayWidthCm} × ${result.billing.displayHeightCm} cm`], ["Sposób rozliczenia", result.billing.billingMethod], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
          return;
        }
        if (!imageInfo) throw new Error("Najpierw wybierz zdjęcie.");
        if (value("canvasImageSizeMode") === "Proponowane formaty") {
          const selected = imageInfo.suggestions[Number(value("canvasSuggestion"))];
          const result = C.calculateCanvasStandard(state.prices, selected.formatKey, quantity);
          showQuote({ title: "Obrazy na płótnie", description: `${selected.displayWidthCm} × ${selected.displayHeightCm} cm, ${quantity} szt., plik ${imageInfo.file.name}`, price: result.price, details: [["Format cennikowy", selected.formatKey], ["Cena jednostkowa", `${money(result.unitPrice)} zł`], ["Różnica proporcji", `${num(selected.ratioErrorPercent, 2)}%`], ["Rozdzielczość pliku", `${imageInfo.width} × ${imageInfo.height} px`]] });
        } else {
          const proportional = C.calculateProportionalCanvasSize(state.prices, imageInfo.width, imageInfo.height, value("canvasKnownSide"), numberValue("canvasKnownValue"));
          const result = C.calculateCanvasCustom(state.prices, proportional.widthCm, proportional.heightCm, quantity);
          showQuote({ title: "Obrazy na płótnie", description: `${num(proportional.widthCm, 1)} × ${num(proportional.heightCm, 1)} cm, ${quantity} szt., plik ${imageInfo.file.name}`, price: result.price, details: [["Format rozliczeniowy", result.billing.formatKey], ["Wymiar rozliczeniowy", `${result.billing.displayWidthCm} × ${result.billing.displayHeightCm} cm`], ["Sposób rozliczenia", result.billing.billingMethod], ["Cena jednostkowa", `${money(result.unitPrice)} zł`], ["Rozdzielczość pliku", `${imageInfo.width} × ${imageInfo.height} px`]] });
        }
      } catch (error) {
        setResultError(error);
      }
    });
  }

  function renderCart() {
    if (!state.cart.length) {
      cartPanel.innerHTML = `<div class="card"><h2>Koszyk</h2>${alertBox("Koszyk jest pusty.", "info")}</div>`;
      return;
    }
    const total = state.cart.reduce((sum, item) => sum + Number(item.price), 0);
    cartPanel.innerHTML = `<div class="card"><h2>Koszyk</h2><div class="cart-list">${state.cart.map((item, index) => `<article class="cart-card"><h4>${index + 1}. ${esc(item.title)}</h4><p>${esc(item.description)}</p><div class="cart-card-footer"><strong>${money(item.price)} zł</strong><button class="button danger" data-remove="${esc(item.id)}">Usuń</button></div></article>`).join("")}</div>
      <div class="cart-total"><span>Razem brutto</span><strong>${money(total)} zł</strong></div>
      <div class="actions"><button class="button secondary full" id="downloadCsv">Pobierz koszyk CSV</button><button class="button danger full" id="clearCart">Wyczyść koszyk</button></div>
      ${renderOrderFormHtml(total)}</div>`;
    cartPanel.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => { state.cart = state.cart.filter(item => String(item.id) !== button.dataset.remove); saveState(); renderCart(); }));
    document.getElementById("clearCart").addEventListener("click", () => { state.cart = []; saveState(); renderCart(); });
    document.getElementById("downloadCsv").addEventListener("click", downloadCsv);
    ["orderName","orderEmail","orderPhone","orderPickup","orderNotes"].forEach(id => document.getElementById(id).addEventListener("input", updateOrderText));
    document.getElementById("copySubject").addEventListener("click", () => copyText(document.getElementById("orderSubject").value));
    document.getElementById("copyOrder").addEventListener("click", () => copyText(document.getElementById("orderText").value));
    updateOrderText();
  }

  function renderOrderFormHtml() {
    return `<section class="order-card"><h3>Formularz zamówienia</h3><p class="muted">Dane pozostają w przeglądarce. Skopiuj gotowy tekst do maila.</p>
      <div class="field"><label>Imię i nazwisko / firma</label><input id="orderName" value="${esc(state.order.name)}" placeholder="np. Jan Kowalski / Firma ABC"></div>
      <div class="field"><label>E-mail</label><input id="orderEmail" type="email" value="${esc(state.order.email)}"></div>
      <div class="field"><label>Telefon</label><input id="orderPhone" value="${esc(state.order.phone)}"></div>
      <div class="field"><label>Sposób odbioru</label><select id="orderPickup">${options(["Odbiór osobisty", "Wysyłka kurierska", "Do ustalenia"], state.order.pickup)}</select></div>
      <div class="field"><label>Uwagi</label><textarea id="orderNotes">${esc(state.order.notes)}</textarea></div>
      <div class="field"><label>Temat wiadomości</label><div class="code-box"><input id="orderSubject" readonly><button id="copySubject" class="button secondary copy-button">Kopiuj</button></div></div>
      <div class="field"><label>Treść wiadomości</label><div class="code-box"><textarea id="orderText" readonly></textarea><button id="copyOrder" class="button secondary copy-button">Kopiuj</button></div></div>
    </section>`;
  }

  function updateOrderText() {
    state.order = { name: value("orderName"), email: value("orderEmail"), phone: value("orderPhone"), pickup: value("orderPickup"), notes: value("orderNotes") };
    saveState();
    document.getElementById("orderSubject").value = "Zamówienie z kalkulatora Druk24";
    const total = state.cart.reduce((sum, item) => sum + Number(item.price), 0);
    const lines = ["Dzień dobry,", "", "proszę o realizację poniższego zamówienia:", ""];
    state.cart.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.title}`, `   ${item.description}`);
      (item.details || []).forEach(([label, val]) => lines.push(`   ${label}: ${val}`));
      lines.push(`   Cena brutto: ${money(item.price)} zł`, "");
    });
    lines.push(`RAZEM BRUTTO: ${money(total)} zł`, "", "Dane zamawiającego:", `Imię i nazwisko / firma: ${state.order.name || "—"}`, `E-mail: ${state.order.email || "—"}`, `Telefon: ${state.order.phone || "—"}`, `Sposób odbioru: ${state.order.pickup}`);
    if (state.order.notes.trim()) lines.push("", "Uwagi do zamówienia:", state.order.notes.trim());
    lines.push("", "Proszę o potwierdzenie ceny, terminu realizacji oraz sposobu przekazania plików.", "", "Pozdrawiam,", state.order.name || "");
    document.getElementById("orderText").value = lines.join("\n").trimEnd();
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); showToast("Skopiowano do schowka"); }
    catch { const temp = document.createElement("textarea"); temp.value = text; document.body.appendChild(temp); temp.select(); document.execCommand("copy"); temp.remove(); showToast("Skopiowano do schowka"); }
  }

  function downloadCsv() {
    const rows = [["Lp.", "Produkt", "Opis", "Cena brutto"], ...state.cart.map((item, i) => [i + 1, item.title, item.description, Number(item.price).toFixed(2).replace(".", ",")]), [], ["", "RAZEM", "", state.cart.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2).replace(".", ",")]];
    const csv = "\uFEFF" + rows.map(row => row.map(cell => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = "wycena_kalkulator_druku.csv"; link.click(); URL.revokeObjectURL(link.href);
  }
})();
