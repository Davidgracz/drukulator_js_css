(function () {
  "use strict";

  const VERSION = "0.1.8v — GitHub Pages";
  const C = window.Calculators;
  const content = document.getElementById("content");
  const navigation = document.getElementById("navigation");
  const cartPanel = document.getElementById("cartPanel");
  const toast = document.getElementById("toast");
  const sidebar = document.getElementById("sidebar");

  const state = {
    prices: null,
    page: "Start",
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
    ["Obrazy na płótnie", renderCanvas]
  ];

  document.getElementById("versionLabel").textContent = VERSION;
  document.getElementById("menuToggle").addEventListener("click", () => sidebar.classList.toggle("open"));

  boot();

  async function boot() {
    try {
      const response = await fetch("data/prices.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Błąd pobierania cennika: HTTP ${response.status}`);
      state.prices = await response.json();
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
    navigation.innerHTML = pages.map(([name]) => `<button class="nav-button${name === state.page ? " active" : ""}" data-page="${esc(name)}">${esc(name)}</button>`).join("");
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
    content.innerHTML = `${header("Roll-up i X-baner")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj produktu</label><select id="rollProduct">${options(Object.keys(root))}</select></div>
      <div class="field half"><label>Szerokość / format</label><select id="rollSize"></select></div>
      <div class="field"><label>Ilość sztuk</label><input id="rollQty" type="number" min="1" step="1" value="1"></div>
    </div><div id="rollInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const product = document.getElementById("rollProduct"), size = document.getElementById("rollSize");
    function refresh() { size.innerHTML = options(Object.keys(root[product.value])); document.getElementById("rollInfo").innerHTML = alertBox(product.value === "X-baner" ? "Format określony w wybranym wariancie." : "Wysokość roll-upu: 200 cm.", "info"); }
    product.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateRollup(state.prices, product.value, size.value, numberValue("rollQty"));
      showQuote({ title: product.value, description: `${product.value}, ${size.value}, ${value("rollQty")} szt.`, price: result.price, details: [["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderPvc() {
    const root = state.prices.pvc;
    content.innerHTML = `${header("Druk na PCV")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj produktu</label><select id="pvcProduct">${options(Object.keys(root))}</select></div>
      <div class="field half"><label>Grubość płyty</label><select id="pvcThickness"></select></div>
      <div class="field third"><label>Szerokość jednej sztuki [cm]</label><input id="pvcWidth" type="number" min="0.1" step="1" value="100"></div>
      <div class="field third"><label>Wysokość jednej sztuki [cm]</label><input id="pvcHeight" type="number" min="0.1" step="1" value="50"></div>
      <div class="field third"><label>Ilość sztuk</label><input id="pvcQty" type="number" min="1" step="1" value="1"></div>
    </div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const product = document.getElementById("pvcProduct"), thickness = document.getElementById("pvcThickness");
    function refresh() { thickness.innerHTML = options(root[product.value].grubosc || ["Nie dotyczy"]); }
    product.addEventListener("change", refresh); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculatePvc(state.prices, numberValue("pvcWidth"), numberValue("pvcHeight"), numberValue("pvcQty"), product.value);
      showQuote({ title: "Druk na PCV", description: `${product.value}, płyta ${thickness.value}, ${value("pvcWidth")} × ${value("pvcHeight")} cm, ${value("pvcQty")} szt.`, price: result.price, details: [["Łączna powierzchnia", `${num(result.totalArea)} m²`], ["Cena za m²", `${money(result.unitPrice)} zł`], ["Minimum zamówienia", `${money(result.minimumOrder)} zł`]] });
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
      document.getElementById("appInfo").innerHTML = `${data.opis ? alertBox(data.opis, "info") : ""}${alertBox(`Rabat: ${root.rabaty.od_10_sztuk || 10}% od 10 sztuk, ${root.rabaty.powyzej_20_sztuk || 20}% powyżej 20 sztuk.`, "info")}`;
    }
    category.addEventListener("change", refreshProducts); product.addEventListener("change", refreshPrints); refreshProducts();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const result = C.calculateApparel(state.prices, category.value, product.value, front.value, back.value, numberValue("appQty"));
      const details = [["Cena bazowa za sztukę", `${money(result.baseUnitPrice)} zł`], ["Dopłata za drugi nadruk", `${money(result.extraPrintPrice)} zł`], ["Cena jednostkowa przed rabatem", `${money(result.unitPrice)} zł`], ["Wartość przed rabatem", `${money(result.priceBeforeDiscount)} zł`], ["Rabat", `${num(result.discountPercent, 0)}% = ${money(result.discountAmount)} zł`]];
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
    content.innerHTML = `${header("Obrazy na płótnie", `${root.material || "Płótno"}; maksymalny bok: ${root.maksymalny_bok_cm || 150} cm`)}<div class="card">
      <div class="field"><label>Wybierz plik JPG / PNG / WebP</label><input id="canvasFile" type="file" accept="image/jpeg,image/png,image/webp,image/tiff"></div>
      <div id="canvasWorkspace">${alertBox("Wczytaj zdjęcie, aby dopasować format do jego proporcji.", "info")}</div>
    </div><div id="quoteArea"></div>`;
    document.getElementById("canvasFile").addEventListener("change", event => {
      const file = event.target.files[0]; if (!file) return;
      const image = new Image(); const url = URL.createObjectURL(file);
      image.onload = () => { renderCanvasControls(file, url, image.naturalWidth, image.naturalHeight); };
      image.onerror = () => { document.getElementById("canvasWorkspace").innerHTML = alertBox("Nie można odczytać tego pliku obrazu.", "error"); URL.revokeObjectURL(url); };
      image.src = url;
    });
  }

  function renderCanvasControls(file, url, imageWidth, imageHeight) {
    const workspace = document.getElementById("canvasWorkspace");
    workspace.innerHTML = `<img class="image-preview" src="${url}" alt="Podgląd"><p class="muted">${esc(file.name)} — ${imageWidth} × ${imageHeight} px</p><div class="form-grid">
      <div class="field half"><label>Sposób wyboru rozmiaru</label><select id="canvasMode">${options(["Proponowane formaty", "Podaj jeden bok"])}</select></div>
      <div class="field half"><label>Ilość obrazów</label><input id="canvasQty" type="number" min="1" step="1" value="1"></div>
      <div id="canvasDynamic" class="field" style="display:contents"></div>
    </div><div id="canvasMessage"></div><div class="actions"><button class="button" id="calculateCanvas">Oblicz cenę</button></div>`;
    const mode = document.getElementById("canvasMode"), dynamic = document.getElementById("canvasDynamic");
    function refresh() {
      document.getElementById("canvasMessage").innerHTML = "";
      if (mode.value === "Proponowane formaty") {
        const suggestions = C.getCanvasSuggestions(state.prices, imageWidth, imageHeight);
        dynamic.innerHTML = `<div class="field"><label>Proponowany format obrazu</label><select id="canvasSuggestion">${suggestions.map((item, i) => `<option value="${i}">${item.displayWidthCm} × ${item.displayHeightCm} cm — ${money(item.price)} zł/szt. — różnica proporcji ${num(item.ratioErrorPercent, 2)}%</option>`).join("")}</select></div>`;
        dynamic.dataset.suggestions = JSON.stringify(suggestions);
      } else {
        dynamic.innerHTML = `<div class="field half"><label>Który bok podajesz?</label><select id="canvasKnownSide">${options(["Szerokość", "Wysokość"])}</select></div><div class="field half"><label>Wartość podanego boku [cm]</label><input id="canvasKnownValue" type="number" min="0.1" step="0.1" value="60"></div>`;
        const updateSize = () => { try { const r = C.calculateProportionalCanvasSize(state.prices, imageWidth, imageHeight, value("canvasKnownSide"), numberValue("canvasKnownValue")); document.getElementById("canvasMessage").innerHTML = alertBox(`Rozmiar z zachowaniem proporcji: ${num(r.widthCm, 1)} × ${num(r.heightCm, 1)} cm`, "success"); } catch (e) { document.getElementById("canvasMessage").innerHTML = alertBox(e.message, "warning"); } };
        document.getElementById("canvasKnownSide").addEventListener("change", updateSize); document.getElementById("canvasKnownValue").addEventListener("input", updateSize); updateSize();
      }
    }
    mode.addEventListener("change", refresh); refresh();
    document.getElementById("calculateCanvas").addEventListener("click", () => { try {
      const quantity = numberValue("canvasQty");
      if (mode.value === "Proponowane formaty") {
        const suggestions = JSON.parse(dynamic.dataset.suggestions), selected = suggestions[Number(value("canvasSuggestion"))];
        const result = C.calculateCanvasStandard(state.prices, selected.formatKey, quantity);
        showQuote({ title: "Obrazy na płótnie", description: `${selected.displayWidthCm} × ${selected.displayHeightCm} cm, ${quantity} szt., plik ${file.name}`, price: result.price, details: [["Format cennikowy", selected.formatKey], ["Cena jednostkowa", `${money(result.unitPrice)} zł`], ["Różnica proporcji", `${num(selected.ratioErrorPercent, 2)}%`], ["Rozdzielczość pliku", `${imageWidth} × ${imageHeight} px`]] });
      } else {
        const proportional = C.calculateProportionalCanvasSize(state.prices, imageWidth, imageHeight, value("canvasKnownSide"), numberValue("canvasKnownValue"));
        const result = C.calculateCanvasCustom(state.prices, proportional.widthCm, proportional.heightCm, quantity);
        showQuote({ title: "Obrazy na płótnie", description: `${num(proportional.widthCm, 1)} × ${num(proportional.heightCm, 1)} cm, ${quantity} szt., plik ${file.name}`, price: result.price, details: [["Format rozliczeniowy", result.billing.formatKey], ["Wymiar rozliczeniowy", `${result.billing.displayWidthCm} × ${result.billing.displayHeightCm} cm`], ["Sposób rozliczenia", result.billing.billingMethod], ["Cena jednostkowa", `${money(result.unitPrice)} zł`], ["Rozdzielczość pliku", `${imageWidth} × ${imageHeight} px`]] });
      }
    } catch (e) { setResultError(e); } });
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
