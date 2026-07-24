(function () {
  "use strict";

  const VERSION = "0.5.9v";
  const C = window.Calculators;
  const content = document.getElementById("content");
  const navigation = document.getElementById("navigation");
  const cartPanel = document.getElementById("cartPanel");
  const toast = document.getElementById("toast");
  const sidebar = document.getElementById("sidebar");
  const downloadPricesButton = document.getElementById("downloadPrices");
  const siteMenuToggle = document.getElementById("siteMenuToggle");
  const siteNavigation = document.getElementById("siteNavigation");
  const themeToggle = document.getElementById("themeToggle");
  const productSearch = document.getElementById("productSearch");
  const productSearchResults = document.getElementById("productSearchResults");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const THEME_KEY = "drukulator_theme";
  const PRICE_OVERRIDE_KEY = "drukulator_prices_override_0_5_9";
  const LEGACY_PRICE_OVERRIDE_KEYS = ["drukulator_prices_override_0_5_8", "drukulator_prices_override_0_5_7", "drukulator_prices_override_0_5_6", "drukulator_prices_override_0_5_5", "drukulator_prices_override_0_5_4", "drukulator_prices_override_0_5_3", "drukulator_prices_override_0_5_2", "drukulator_prices_override_0_5_1", "drukulator_prices_override_0_5_0", "drukulator_prices_override_0_4_1", "drukulator_prices_override_0_4_0", "drukulator_prices_override_0_3_1", "drukulator_prices_override_0_3_0"];
  const SEARCH_TERMS_OVERRIDE_KEY = "drukulator_search_terms_override_0_5_9";
  const LEGACY_SEARCH_TERMS_OVERRIDE_KEYS = ["drukulator_search_terms_override_0_5_8", "drukulator_search_terms_override_0_5_7", "drukulator_search_terms_override_0_5_6", "drukulator_search_terms_override_0_5_5", "drukulator_search_terms_override_0_5_4", "drukulator_search_terms_override_0_5_3", "drukulator_search_terms_override_0_5_2", "drukulator_search_terms_override_0_5_1"];
  const ADMIN_SESSION_KEY = "drukulator_admin_unlocked";
  const ADMIN_PASSWORD_HASH = "76ec9956";
  const ROULETTE_TRIGGER = "we wtorki chodze do kasyna";
  const ROULETTE_STORAGE_KEY = "drukulator_roulette_0_5_9";
  const ROULETTE_MAX_DISCOUNT = 20;
  const ROULETTE_RED_NUMBERS = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18,
    19, 21, 23, 25, 27, 30, 32, 34, 36
  ]);

  const state = {
    basePrices: null,
    prices: null,
    baseSearchTerms: null,
    searchTerms: null,
    page: "Start",
    searchQuery: "",
    adminUnlocked: loadSessionFlag(ADMIN_SESSION_KEY),
    cart: loadJson("drukulator_cart", []),
    order: loadJson("drukulator_order", {
      name: "", email: "", phone: "", pickup: "Odbiór osobisty", notes: ""
    }),
    roulette: normalizeRouletteState(loadJson(ROULETTE_STORAGE_KEY, null))
  };

  const pages = [
    ["Start", renderHome],
    ["Wizytówki 24h", renderBusinessCards],
    ["Ulotki 24h", renderFlyers],
    ["Plakaty 24h", renderPosters],
    ["Druk cyfrowy 24h", renderDigital],
    ["Folie i banery 24h", renderBanners],
    ["Naklejki", renderStickers],
    ["Roll-up", renderRollup],
    ["PCV i pianki", renderPvc],
    ["Koszulki i odzież", renderApparel],
    ["Oprawa prac", renderBinding],
    ["Laminowanie", renderLamination],
    ["Obrazy na płótnie", renderCanvas],
    ["Edycja cen", renderPriceAdmin],
    ["Edycja wyszukiwarki", renderSearchAdmin]
  ];

  const ADMIN_PAGE_NAMES = new Set(["Edycja cen", "Edycja wyszukiwarki"]);

  const DEFAULT_PRODUCT_SEARCH_TERMS = {
    "Wizytówki 24h": [
      "wizytowki", "wizytowka", "wizytowek", "wizytowke", "wiytowki", "wizytuwki",
      "karty biznesowe", "karta biznesowa", "business card", "business cards", "karty firmowe",
      "karta kontaktowa", "dane kontaktowe na karcie", "85x55", "90x50", "soft touch",
      "wizytowki z folia", "wizytowki foliowane", "wizytowki dwustronne", "wizytowki jednostronne",
      "wizytowki 24h", "wizytówki 24h", "wizytowki cyfrowe", "wizytowki offsetowe"
    ],
    "Ulotki 24h": [
      "ulotki", "ulotka", "ulotek", "ulotke", "flyer", "flyers", "folder reklamowy",
      "reklama papierowa", "materialy reklamowe", "rozdawane ulotki", "ulotki a6", "ulotki a5",
      "ulotki a4", "ulotki dl", "ulotki 24h", "ulotka 24h", "ulotki ekspres", "ulotki skladane", "ulotki cyfrowe", "ulotki offsetowe"
    ],
    "Folie i banery 24h": [
      "folie", "folia", "folii", "baner", "banery", "banner", "frontlit", "mesh", "siatka mesh",
      "baner reklamowy", "baner z oczkami", "druk banera", "folia mat", "folia matowa", "folia blysk",
      "folia blyszczaca", "folia z laminatem", "folia laminowana", "folia owh", "folia owv",
      "one way vision", "folia transparentna", "folia przezroczysta", "naklejka na witryne",
      "oklejenie witryny", "grafika na szybe", "druk na folii", "folia samoprzylepna",
      "folie i banery 24h", "banery 24h", "folie 24h", "baner powlekany", "baner powlekany 510g",
      "folia do podswietlen", "folia podświetlana", "backlit", "folia do kasetonu", "folia do lightboxa",
      "folia z transferem", "folia transferowa", "transfer folia", "transfer tape"
    ],
    "Naklejki": [
      "naklejki", "naklejka", "naklejek", "naklejke", "wlepki", "wlepka", "wlepek", "etykiety",
      "etykieta", "etykiet", "sticker", "stickers", "naklejki laminowane", "etykiety laminowane",
      "naklejki wycinane", "naklejki ploterowe", "naklejki na rolce", "naklejki na arkuszu",
      "naklejki produktowe", "etykiety produktowe", "etykiety cenowe", "naklejki z logo",
      "naklejki okragle", "naklejki prostokatne", "naklejki dowolny ksztalt", "wlepki reklamowe",
      "naklejki taxi", "magnes taxi"
    ],
    "Plakaty 24h": [
      "plakaty", "plakat", "plakatow", "poster", "postery", "afisz", "afisze", "plakat reklamowy",
      "plakaty 24h", "plakat 24h", "plakat ekspres", "plakat na jutro", "wielkoformatowy 24h",
      "plakat a3", "plakat a2", "plakat a1", "plakat a0", "duzy wydruk", "druk wielkoformatowy",
      "plakat cyfrowy", "plakat offsetowy", "papier plakatowy"
    ],
    "Roll-up": [
      "rollup", "roll up", "roll-up", "rollupy", "rolap", "rolup", "x baner", "x-baner", "x banner",
      "stojak reklamowy", "system wystawienniczy", "scianka reklamowa", "potykacz reklamowy",
      "rollup standard", "rollup black", "rollup czarny", "rollup exclusive", "rollup lezka",
      "rollup dwustronny", "rollup podwojny", "wklad do rollupa", "wymiana wkladu rollup"
    ],
    "PCV i pianki": [
      "pcv", "pvc", "plyta pcv", "plyta pvc", "tablica", "tabliczka", "tablice", "szyld", "szyldy",
      "plansza", "plansze", "druk na plycie", "druk na pcv", "folia na pcv", "folia plus pcv",
      "tablica reklamowa", "tabliczka informacyjna", "tabliczka firmowa", "sztywna plyta",
      "pcv 2 mm", "pcv 3 mm", "pcv 4 mm", "pcv 5 mm", "pianka", "pianki", "plansza piankowa",
      "plansze piankowe", "pianka 5 mm", "plyta piankowa", "foam board", "foamboard", "kapa",
      "plansza a3", "plansza a2", "plansza a1", "plansza b2", "plansza b1", "plansza b0",
      "lekka plansza", "plansza wystawowa", "plansza prezentacyjna", "wydruk na piance"
    ],
    "Druk cyfrowy 24h": [
      "druk cyfrowy", "drukowanie", "wydruk", "wydruki", "ksero", "kopie", "kopiowanie", "skanowanie",
      "druk dokumentow", "druk cyfrowy 24h", "druk 24h", "wydruk 24h", "druk a4", "druk a3", "kolor a4", "kolorowy a4", "czarno bialy",
      "druk dwustronny", "druk jednostronny", "papier kredowy", "papier 130g", "papier 170g",
      "papier 250g", "papier 300g", "sra4", "sra3", "arkuszowanie", "impozycja", "uzytki na arkuszu",
      "winietki", "winietka", "winietek", "zaproszenia", "zaproszenie", "bilety", "bilet", "vouchery",
      "voucher", "kupony", "kupon", "karteczki", "karty menu", "menu restauracyjne", "certyfikaty",
      "dyplomy", "identyfikatory papierowe", "papier firmowy", "preprint", "druk malego formatu"
    ],
    "Koszulki i odzież": [
      "koszulki", "koszulka", "koszulek", "odziez", "odziezy", "ubrania z nadrukiem", "nadruk na koszulce",
      "nadruki na odziezy", "dtf", "termotransfer", "bluza", "bluzy", "czapka", "czapki", "torba z nadrukiem",
      "fartuch z nadrukiem", "odziez firmowa", "koszulka firmowa", "koszulka z logo", "sam nadruk",
      "dodatkowy nadruk", "nadruk przod", "nadruk tyl"
    ],
    "Oprawa prac": [
      "oprawa", "oprawa prac", "bindowanie", "bindownica", "spirala", "oprawa spiralna", "termobindowanie",
      "praca dyplomowa", "praca magisterska", "magisterska", "praca licencjacka", "licencjacka",
      "praca doktorska", "doktorat", "oprawa dokumentu", "oprawa ksiazki", "druk i oprawa",
      "oprawa miekka", "oprawa twarda"
    ],
    "Laminowanie": [
      "laminowanie", "laminacja", "zalaminowac", "zalaminowanie", "laminat dokumentu", "folia laminacyjna",
      "laminowanie a4", "laminowanie a3", "laminowanie a5", "laminowanie wizytowki", "ochrona dokumentu",
      "foliowanie dokumentu", "dokument w folii", "80 mikronow"
    ],
    "Obrazy na płótnie": [
      "obrazy", "obraz", "obrazu", "plotno", "plotnie", "canvas", "fotoobraz", "foto obraz",
      "zdjecie na plotnie", "fotografia na plotnie", "obraz ze zdjecia", "druk na plotnie", "wydruk na canvas",
      "obraz na sciane", "portret na plotnie", "obraz panoramiczny", "wlasny rozmiar obrazu"
    ]
  };

  const SEARCH_STOP_WORDS = new Set([
    "chce", "chcialbym", "chcialabym", "potrzebuje", "poprosze", "prosze", "mozna", "zrobic",
    "zamowic", "zamowie", "wycenic", "wycena", "cena", "koszt", "ile", "bedzie", "interesuje",
    "mnie", "mi", "dla", "na", "do", "od", "z", "ze", "i", "oraz", "albo", "czy", "jak",
    "szt", "sztuk", "sztuki", "format", "rozmiar", "wymiar", "potrzebny", "potrzebna", "potrzebne"
  ]);

  document.getElementById("versionLabel").textContent = VERSION;
  document.getElementById("menuToggle").addEventListener("click", () => sidebar.classList.toggle("open"));
  if (siteMenuToggle && siteNavigation) {
    siteMenuToggle.addEventListener("click", () => {
      const isOpen = siteNavigation.classList.toggle("is-open");
      siteMenuToggle.classList.toggle("is-open", isOpen);
      siteMenuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNavigation.addEventListener("click", event => {
      if (!event.target.closest("a")) return;
      siteNavigation.classList.remove("is-open");
      siteMenuToggle.classList.remove("is-open");
      siteMenuToggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", event => {
      if (siteNavigation.contains(event.target) || siteMenuToggle.contains(event.target)) return;
      siteNavigation.classList.remove("is-open");
      siteMenuToggle.classList.remove("is-open");
      siteMenuToggle.setAttribute("aria-expanded", "false");
    });
  }
  setupThemeToggle();
  setupProductSearch();
  downloadPricesButton.addEventListener("click", downloadPricesJson);

  function setupThemeToggle() {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(currentTheme, false);

    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .toLocaleLowerCase("pl-PL")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function levenshteinDistance(a, b) {
    const left = String(a);
    const right = String(b);
    const rows = right.length + 1;
    const previous = Array.from({ length: rows }, (_, index) => index);

    for (let i = 1; i <= left.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= right.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
        );
      }
      previous.splice(0, previous.length, ...current);
    }

    return previous[right.length];
  }

  function getProductSearchMatches(query) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return [];
    const rawTokens = normalizedQuery.split(/\s+/).filter(token => token.length > 1);
    const queryTokens = rawTokens.filter(token => !SEARCH_STOP_WORDS.has(token));
    const meaningfulTokens = queryTokens.length ? queryTokens : rawTokens;

    return Object.entries(state.searchTerms || DEFAULT_PRODUCT_SEARCH_TERMS).map(([pageName, terms]) => {
      const normalizedTerms = [pageName, ...terms].map(normalizeSearchText);
      let score = 0;

      for (const term of normalizedTerms) {
        if (term === normalizedQuery) score = Math.max(score, 120);
        else if (term.includes(normalizedQuery) || normalizedQuery.includes(term)) score = Math.max(score, 90);

        const termTokens = term.split(/\s+/);
        for (const token of meaningfulTokens) {
          if (term.includes(token)) {
            score += 24;
            continue;
          }

          let bestDistance = Infinity;
          for (const termToken of termTokens) {
            bestDistance = Math.min(bestDistance, levenshteinDistance(token, termToken));
          }
          const allowedDistance = token.length >= 8 ? 2 : token.length >= 5 ? 1 : 0;
          if (bestDistance <= allowedDistance) score += 18 - bestDistance * 5;
        }
      }

      const combinedTerms = normalizedTerms.join(" ");
      const matchedTokenCount = meaningfulTokens.filter(token => {
        if (combinedTerms.includes(token)) return true;
        return normalizedTerms.some(term => term.split(/\s+/).some(termToken => {
          const allowedDistance = token.length >= 8 ? 2 : token.length >= 5 ? 1 : 0;
          return allowedDistance > 0 && levenshteinDistance(token, termToken) <= allowedDistance;
        }));
      }).length;

      if (meaningfulTokens.length > 1 && matchedTokenCount === meaningfulTokens.length) score += 45;
      else if (matchedTokenCount >= 2) score += matchedTokenCount * 12;

      return { pageName, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.pageName.localeCompare(b.pageName, "pl"));
  }

  function setupProductSearch() {
    if (!productSearch || !productSearchResults) return;

    productSearch.addEventListener("input", () => {
      state.searchQuery = productSearch.value;
      if (isRouletteTrigger(state.searchQuery)) {
        openRouletteEasterEgg();
        return;
      }
      renderNavigation();
    });

    productSearch.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      if (isRouletteTrigger(state.searchQuery)) {
        event.preventDefault();
        openRouletteEasterEgg();
        return;
      }
      const [bestMatch] = getProductSearchMatches(state.searchQuery);
      if (!bestMatch) return;
      event.preventDefault();
      openPageFromSearch(bestMatch.pageName);
    });
  }

  function isRouletteTrigger(query) {
    return normalizeSearchText(query) === ROULETTE_TRIGGER;
  }

  function normalizeRouletteState(saved) {
    const balance = Number(saved && saved.balance);
    const lastNumber = Number.isInteger(saved && saved.lastNumber) ? saved.lastNumber : null;
    const lastColor = ["red", "black", "green"].includes(saved && saved.lastColor) ? saved.lastColor : null;
    const plays = Math.max(0, Number.parseInt(saved && saved.plays, 10) || 0);
    return {
      balance: Number.isFinite(balance) ? Math.max(0, Math.min(ROULETTE_MAX_DISCOUNT, Math.round(balance))) : 5,
      lastNumber,
      lastColor,
      plays
    };
  }

  function saveRouletteState() {
    try {
      localStorage.setItem(ROULETTE_STORAGE_KEY, JSON.stringify(state.roulette));
    } catch {
      // Gra działa również bez pamięci lokalnej.
    }
  }

  function openRouletteEasterEgg() {
    state.searchQuery = "";
    productSearch.value = "";
    productSearchResults.innerHTML = "";
    renderNavigation();
    sidebar.classList.remove("open");

    let overlay = document.getElementById("rouletteEasterEgg");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "rouletteEasterEgg";
      overlay.className = "roulette-overlay";
      overlay.innerHTML = `
        <section class="roulette-dialog" role="dialog" aria-modal="true" aria-labelledby="rouletteTitle">
          <button class="roulette-close" id="rouletteClose" type="button" aria-label="Zamknij ruletkę">×</button>
          <p class="roulette-kicker">Sekret Druk24</p>
          <h2 id="rouletteTitle">Wtorkowa ruletka zniżek</h2>
          <p class="roulette-intro">Każdy żeton to 1% zniżki. Wybierz kolor, ustaw stawkę i zakręć kołem.</p>

          <div class="roulette-balance">
            <span>Saldo zniżki</span>
            <strong id="rouletteBalance">5%</strong>
            <small>Maksymalnie ${ROULETTE_MAX_DISCOUNT}%</small>
          </div>

          <div class="roulette-wheel-wrap">
            <div class="roulette-pointer" aria-hidden="true"></div>
            <div class="roulette-wheel" id="rouletteWheel" aria-hidden="true">
              <span id="rouletteNumber">?</span>
            </div>
          </div>

          <div class="roulette-controls">
            <div class="field">
              <label for="rouletteStake">Stawka</label>
              <select id="rouletteStake"></select>
            </div>
            <div class="roulette-colors" role="group" aria-label="Wybierz kolor">
              <button class="roulette-color red is-selected" type="button" data-roulette-color="red">Czerwone</button>
              <button class="roulette-color black" type="button" data-roulette-color="black">Czarne</button>
              <button class="roulette-color green" type="button" data-roulette-color="green">Zero</button>
            </div>
            <button class="button full roulette-spin" id="rouletteSpin" type="button">Zakręć</button>
            <button class="button secondary full hidden" id="rouletteRestart" type="button">Zacznij od 5%</button>
          </div>

          <div class="roulette-result" id="rouletteResult" aria-live="polite">Wybierz kolor i zakręć kołem.</div>
          <div class="roulette-footer-actions">
            <button class="button secondary" id="rouletteCopy" type="button">Kopiuj wynik</button>
          </div>
          <p class="roulette-note">Wynik easter egga wymaga potwierdzenia przy składaniu zamówienia.</p>
        </section>`;
      document.body.appendChild(overlay);
      setupRouletteEvents(overlay);
    }

    overlay.classList.add("is-open");
    document.body.classList.add("roulette-open");
    updateRouletteUi();
    document.getElementById("rouletteClose").focus();
  }

  function setupRouletteEvents(overlay) {
    overlay.querySelector("#rouletteClose").addEventListener("click", closeRouletteEasterEgg);
    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeRouletteEasterEgg();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) closeRouletteEasterEgg();
    });

    overlay.querySelectorAll("[data-roulette-color]").forEach(button => {
      button.addEventListener("click", () => {
        overlay.querySelectorAll("[data-roulette-color]").forEach(item => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
      });
    });

    overlay.querySelector("#rouletteSpin").addEventListener("click", spinRoulette);
    overlay.querySelector("#rouletteRestart").addEventListener("click", () => {
      state.roulette = { balance: 5, lastNumber: null, lastColor: null, plays: 0 };
      saveRouletteState();
      updateRouletteUi("Nowa runda. Masz 5 żetonów zniżki.");
    });
    overlay.querySelector("#rouletteCopy").addEventListener("click", () => {
      copyText(`Wtorkowa ruletka Druk24 — moje saldo zniżki: ${state.roulette.balance}%`);
    });
  }

  function closeRouletteEasterEgg() {
    const overlay = document.getElementById("rouletteEasterEgg");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("roulette-open");
    productSearch.focus();
  }

  function rouletteColorForNumber(number) {
    if (number === 0) return "green";
    return ROULETTE_RED_NUMBERS.has(number) ? "red" : "black";
  }

  function rouletteColorLabel(color) {
    return color === "red" ? "czerwone" : color === "black" ? "czarne" : "zero";
  }

  function randomRouletteNumber() {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % 37;
    }
    return Math.floor(Math.random() * 37);
  }

  function spinRoulette() {
    const overlay = document.getElementById("rouletteEasterEgg");
    const spinButton = overlay.querySelector("#rouletteSpin");
    const wheel = overlay.querySelector("#rouletteWheel");
    const stake = Number(overlay.querySelector("#rouletteStake").value);
    const selected = overlay.querySelector("[data-roulette-color].is-selected");
    const selectedColor = selected ? selected.dataset.rouletteColor : "red";

    if (!Number.isInteger(stake) || stake < 1 || stake > state.roulette.balance) {
      updateRouletteUi("Wybierz stawkę, którą masz w saldzie.");
      return;
    }

    spinButton.disabled = true;
    wheel.classList.remove("is-spinning");
    void wheel.offsetWidth;
    wheel.classList.add("is-spinning");
    overlay.querySelector("#rouletteResult").textContent = "Koło się kręci...";
    overlay.querySelector("#rouletteNumber").textContent = "…";

    const number = randomRouletteNumber();
    const resultColor = rouletteColorForNumber(number);

    window.setTimeout(() => {
      const won = resultColor === selectedColor;
      let change = -stake;
      if (won) {
        change = selectedColor === "green" ? stake * 5 : stake;
      }

      state.roulette.balance = Math.max(0, Math.min(ROULETTE_MAX_DISCOUNT, state.roulette.balance + change));
      state.roulette.lastNumber = number;
      state.roulette.lastColor = resultColor;
      state.roulette.plays += 1;
      saveRouletteState();

      wheel.classList.remove("is-spinning", "result-red", "result-black", "result-green");
      wheel.classList.add(`result-${resultColor}`);
      overlay.querySelector("#rouletteNumber").textContent = String(number);
      spinButton.disabled = false;

      const message = won
        ? `Wypadło ${number} (${rouletteColorLabel(resultColor)}). Wygrywasz ${change}% zniżki.`
        : `Wypadło ${number} (${rouletteColorLabel(resultColor)}). Tracisz ${stake}% zniżki.`;
      updateRouletteUi(message);
    }, 1350);
  }

  function updateRouletteUi(message) {
    const overlay = document.getElementById("rouletteEasterEgg");
    if (!overlay) return;

    const balance = state.roulette.balance;
    overlay.querySelector("#rouletteBalance").textContent = `${balance}%`;
    const stakeSelect = overlay.querySelector("#rouletteStake");
    const maxStake = Math.min(5, balance);
    stakeSelect.innerHTML = maxStake > 0
      ? Array.from({ length: maxStake }, (_, index) => `<option value="${index + 1}">${index + 1}%</option>`).join("")
      : '<option value="0">Brak żetonów</option>';
    stakeSelect.disabled = balance <= 0;
    overlay.querySelector("#rouletteSpin").classList.toggle("hidden", balance <= 0);
    overlay.querySelector("#rouletteRestart").classList.toggle("hidden", balance > 0);

    if (message) {
      overlay.querySelector("#rouletteResult").textContent = message;
    } else if (state.roulette.lastNumber !== null) {
      overlay.querySelector("#rouletteResult").textContent = `Ostatnio: ${state.roulette.lastNumber} (${rouletteColorLabel(state.roulette.lastColor)}).`;
      overlay.querySelector("#rouletteNumber").textContent = String(state.roulette.lastNumber);
      const wheel = overlay.querySelector("#rouletteWheel");
      wheel.classList.remove("result-red", "result-black", "result-green");
      wheel.classList.add(`result-${state.roulette.lastColor}`);
    } else {
      overlay.querySelector("#rouletteResult").textContent = "Wybierz kolor i zakręć kołem.";
      overlay.querySelector("#rouletteNumber").textContent = "?";
    }
  }

  function openPageFromSearch(pageName) {
    state.page = pageName;
    state.searchQuery = "";
    if (productSearch) productSearch.value = "";
    renderNavigation();
    renderCurrentPage();
    sidebar.classList.remove("open");
  }

  function renderProductSearchResults(matches) {
    if (!productSearchResults) return;
    const query = normalizeSearchText(state.searchQuery);
    if (!query) {
      productSearchResults.innerHTML = "";
      return;
    }
    if (!matches.length) {
      productSearchResults.innerHTML = '<span class="product-search__empty">Nie znaleziono kategorii</span>';
      return;
    }

    productSearchResults.innerHTML = matches.slice(0, 3).map((match, index) => `
      <button class="product-search__result${index === 0 ? " is-best" : ""}" type="button" data-search-page="${esc(match.pageName)}">
        ${index === 0 ? "Najlepsze dopasowanie: " : ""}${format24hLabel(match.pageName)}
      </button>`).join("");

    productSearchResults.querySelectorAll("[data-search-page]").forEach(button => {
      button.addEventListener("click", () => openPageFromSearch(button.dataset.searchPage));
    });
  }

  function applyTheme(theme, persist) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";

    if (themeToggle) {
      const icon = themeToggle.querySelector(".theme-toggle__icon");
      const label = themeToggle.querySelector(".theme-toggle__label");
      const nextLabel = isDark ? "Tryb jasny" : "Tryb ciemny";

      if (icon) icon.textContent = isDark ? "☀️" : "🌙";
      if (label) label.textContent = nextLabel;
      themeToggle.setAttribute("aria-label", isDark ? "Włącz tryb jasny" : "Włącz tryb ciemny");
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.title = isDark ? "Włącz tryb jasny" : "Włącz tryb ciemny";
    }

    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", "#050505");
    }

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
      } catch {
        // Motyw działa również bez pamięci lokalnej.
      }
    }
  }

  boot();

  async function boot() {
    try {
      const [priceResponse, searchResponse] = await Promise.all([
        fetch("data/prices.json", { cache: "no-store" }),
        fetch("data/search-terms.json", { cache: "no-store" }).catch(() => null)
      ]);

      if (!priceResponse.ok) throw new Error(`Błąd pobierania cennika: HTTP ${priceResponse.status}`);
      state.basePrices = await priceResponse.json();
      const savedPrices = loadSavedPrices();
      state.prices = migratePrices(savedPrices ? mergeDeep(deepClone(state.basePrices), savedPrices) : deepClone(state.basePrices));

      let repositorySearchTerms = deepClone(DEFAULT_PRODUCT_SEARCH_TERMS);
      if (searchResponse && searchResponse.ok) {
        const loadedTerms = await searchResponse.json();
        repositorySearchTerms = sanitizeSearchTerms(loadedTerms, DEFAULT_PRODUCT_SEARCH_TERMS);
      }
      state.baseSearchTerms = repositorySearchTerms;
      state.searchTerms = loadSavedSearchTerms() || deepClone(state.baseSearchTerms);

      downloadPricesButton.disabled = false;
      renderNavigation();
      renderCurrentPage();
      renderCart();
    } catch (error) {
      content.innerHTML = `${header("Błąd uruchomienia", "Nie udało się wczytać plików projektu.")}${alertBox(error.message + " Uruchom projekt przez GitHub Pages albo lokalny serwer HTTP, nie przez dwuklik index.html.", "error")}`;
    }
  }

  function migratePrices(pricesToMigrate) {
    if (!pricesToMigrate || typeof pricesToMigrate !== "object") return pricesToMigrate;

    const banners = pricesToMigrate.banery;
    if (banners && banners["Frontlit 510g"]) {
      const legacyBanner = banners["Frontlit 510g"];
      banners["Baner powlekany 510g"] = mergeDeep(
        banners["Baner powlekany 510g"] || {},
        legacyBanner
      );
      delete banners["Frontlit 510g"];
    }

    const posters = pricesToMigrate.plakaty;
    if (posters) {
      if (posters["Cyfrowy"]) {
        posters["Cyfrowy 24h"] = mergeDeep(
          posters["Cyfrowy 24h"] || {},
          posters["Cyfrowy"]
        );
      }
      delete posters["Cyfrowy"];
      delete posters["Wielkoformatowy"];
    }

    return pricesToMigrate;
  }

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function loadSavedPrices() {
    const keys = [PRICE_OVERRIDE_KEY, ...LEGACY_PRICE_OVERRIDE_KEYS];

    for (const key of keys) {
      const saved = loadJson(key, null);

      if (isValidPriceFile(saved)) {
        if (key !== PRICE_OVERRIDE_KEY) {
          try {
            localStorage.setItem(PRICE_OVERRIDE_KEY, JSON.stringify(saved));
          } catch {
            // Zapis lokalny jest opcjonalny.
          }
        }
        return saved;
      }

      if (saved) {
        try { localStorage.removeItem(key); } catch {}
      }
    }

    return null;
  }
  function loadSavedSearchTerms() {
    const keys = [SEARCH_TERMS_OVERRIDE_KEY, ...LEGACY_SEARCH_TERMS_OVERRIDE_KEYS];

    for (const key of keys) {
      const saved = loadJson(key, null);
      if (isValidSearchTermsFile(saved)) {
        const sanitized = sanitizeSearchTerms(saved, state.baseSearchTerms || DEFAULT_PRODUCT_SEARCH_TERMS);
        if (key !== SEARCH_TERMS_OVERRIDE_KEY) {
          try { localStorage.setItem(SEARCH_TERMS_OVERRIDE_KEY, JSON.stringify(sanitized)); } catch {}
        }
        return sanitized;
      }
      if (saved) {
        try { localStorage.removeItem(key); } catch {}
      }
    }
    return null;
  }

  function isValidSearchTermsFile(valueToCheck) {
    return Boolean(
      valueToCheck &&
      typeof valueToCheck === "object" &&
      !Array.isArray(valueToCheck) &&
      Object.values(valueToCheck).every(items => Array.isArray(items) && items.every(item => typeof item === "string"))
    );
  }

  function sanitizeSearchTerms(source, fallback) {
    const result = {};
    const categories = Object.keys(fallback || DEFAULT_PRODUCT_SEARCH_TERMS);
    categories.forEach(category => {
      const categoryAliases = { "Folie i banery 24h": ["Folie i banery"], "Plakaty 24h": ["Plakaty"], "Wizytówki 24h": ["Wizytówki"], "Ulotki 24h": ["Ulotki"], "Druk cyfrowy 24h": ["Druk cyfrowy i ksero"] };
      const alias = (categoryAliases[category] || []).find(name => Array.isArray(source && source[name]));
      const sourceItems = Array.isArray(source && source[category])
        ? source[category]
        : alias
          ? source[alias]
          : (fallback[category] || []);
      const unique = new Map();
      sourceItems.forEach(item => {
        const phrase = String(item || "").trim();
        const normalized = normalizeSearchText(phrase);
        if (phrase && normalized && !unique.has(normalized)) unique.set(normalized, phrase);
      });
      result[category] = Array.from(unique.values());
    });
    return result;
  }

  function loadSessionFlag(key) {
    try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
  }
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function mergeDeep(base, override) {
    if (Array.isArray(override)) return deepClone(override);
    if (!override || typeof override !== "object") return override;
    const result = base && typeof base === "object" && !Array.isArray(base) ? base : {};
    for (const [key, value] of Object.entries(override)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = mergeDeep(result[key], value);
      } else {
        result[key] = deepClone(value);
      }
    }
    return result;
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

  function format24hLabel(text) {
    return esc(text).replace(/(24h)/gi, '<span class="service-badge-24h">$1</span>');
  }

  function renderNavigation() {
    const matches = getProductSearchMatches(state.searchQuery);
    const matchedPages = new Set(matches.slice(0, 3).map(item => item.pageName));
    const hasSearch = normalizeSearchText(state.searchQuery).length > 0;

    navigation.innerHTML = pages.map(([name]) => {
      const classes = ["nav-button"];
      if (name === state.page) classes.push("active");
      if (ADMIN_PAGE_NAMES.has(name)) classes.push("admin-nav");
      if (hasSearch && matchedPages.has(name)) classes.push("search-match");
      if (hasSearch && !matchedPages.has(name) && name !== "Start" && !ADMIN_PAGE_NAMES.has(name)) classes.push("search-dim");
      return `<button class="${classes.join(" ")}" data-page="${esc(name)}">${format24hLabel(name)}</button>`;
    }).join("");

    renderProductSearchResults(matches);

    navigation.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", () => {
      state.page = button.dataset.page;
      state.searchQuery = "";
      if (productSearch) productSearch.value = "";
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
    content.innerHTML = `${header("Kalkulator Druku", "Wersja statyczna działająca na HTTP")}
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
      banery: "Folie i banery 24h",
      pvc: "PCV i pianki",
      wizytowki: "Wizytówki 24h",
      papier_firmowy: "Papier firmowy",
      rollup: "Roll-up i X-baner",
      ulotki: "Ulotki 24h",
      plakaty: "Plakaty 24h",
      naklejki: "Naklejki i etykiety",
      druk_cyfrowy_i_ksero: "Druk cyfrowy 24h",
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
      szerokosc_cm: "Szerokość [cm]",
      wysokosc_cm: "Wysokość [cm]",
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
    showToast("Przywrócono ceny z serwera");
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

  function renderSearchAdmin() {
    if (!state.adminUnlocked) {
      renderSearchAdminLogin();
      return;
    }

    const hasOverride = Boolean(loadJson(SEARCH_TERMS_OVERRIDE_KEY, null));
    content.innerHTML = `${header("Edycja wyszukiwarki", "Dodawaj własne frazy i określenia klientów")}
      <div class="card admin-toolbar">
        ${alertBox("Frazy zapisane w panelu działają od razu w tej przeglądarce. Aby opublikować je dla wszystkich, pobierz search-terms.json i podmień plik data/search-terms.json na serwerze lub GitHubie.", "info")}
        <div class="admin-status-row">
          <span class="status-dot ${hasOverride ? "active" : ""}"></span>
          <strong id="adminSearchStatus">${hasOverride ? "Używany jest słownik zapisany w tej przeglądarce" : "Używany jest słownik z serwera"}</strong>
        </div>
        <div class="field admin-search"><label>Wyszukaj kategorię</label><input id="searchDictionaryFilter" type="search" placeholder="np. wizytówki, naklejki, pianki"></div>
        <div class="actions admin-actions">
          <button class="button" id="saveSearchDictionary" type="button">Zapisz i zastosuj</button>
          <button class="button secondary" id="downloadSearchDictionary" type="button">Pobierz search-terms.json</button>
          <label class="button secondary admin-file-button">Wczytaj search-terms.json<input id="importSearchDictionary" type="file" accept="application/json,.json"></label>
          <button class="button secondary" id="resetSearchDictionary" type="button">Przywróć słownik z serwera</button>
          <button class="button danger" id="lockSearchAdmin" type="button">Zablokuj panel</button>
        </div>
      </div>
      <div id="searchDictionaryMessage"></div>
      <div id="searchDictionaryEditor" class="search-dictionary-editor">${buildSearchTermsEditor(state.searchTerms)}</div>`;

    document.getElementById("searchDictionaryFilter").addEventListener("input", event => filterSearchTermsEditor(event.target.value));
    document.getElementById("saveSearchDictionary").addEventListener("click", saveSearchTerms);
    document.getElementById("downloadSearchDictionary").addEventListener("click", downloadSearchTermsJson);
    document.getElementById("importSearchDictionary").addEventListener("change", importSearchTerms);
    document.getElementById("resetSearchDictionary").addEventListener("click", resetSearchTerms);
    document.getElementById("lockSearchAdmin").addEventListener("click", lockSearchAdmin);
  }

  function renderSearchAdminLogin() {
    content.innerHTML = `${header("Edycja wyszukiwarki", "Panel administracyjny")}
      <div class="card admin-login-card">
        <form id="searchAdminLoginForm">
          <div class="field"><label>Hasło</label><input id="searchAdminPassword" type="password" autocomplete="current-password" required autofocus></div>
          <div class="actions"><button class="button full" type="submit">Otwórz edycję wyszukiwarki</button></div>
        </form>
        <div id="searchAdminLoginMessage"></div>
        <p class="muted admin-security-note">Panel korzysta z tego samego hasła co edycja cen.</p>
      </div>`;

    document.getElementById("searchAdminLoginForm").addEventListener("submit", event => {
      event.preventDefault();
      const message = document.getElementById("searchAdminLoginMessage");
      const passwordHash = hashPassword(value("searchAdminPassword"));
      if (passwordHash !== ADMIN_PASSWORD_HASH) {
        message.innerHTML = alertBox("Nieprawidłowe hasło.", "error");
        document.getElementById("searchAdminPassword").select();
        return;
      }
      state.adminUnlocked = true;
      try { sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); } catch {}
      renderSearchAdmin();
    });
  }

  function buildSearchTermsEditor(searchTerms) {
    return Object.entries(searchTerms || {}).map(([category, phrases], index) => `
      <details class="search-dictionary-category" data-search-category="${esc(normalizeSearchText(category))}"${index === 0 ? " open" : ""}>
        <summary><span>${esc(category)}</span><span class="admin-count">${phrases.length}</span></summary>
        <div class="search-dictionary-category__body">
          <p class="muted">Jedna fraza w każdym wierszu. Możesz dodawać nazwy potoczne, odmiany i typowe literówki.</p>
          <textarea data-search-terms-category="${esc(category)}" spellcheck="false">${esc(phrases.join("\n"))}</textarea>
        </div>
      </details>`).join("");
  }

  function filterSearchTermsEditor(query) {
    const normalized = normalizeSearchText(query);
    document.querySelectorAll(".search-dictionary-category").forEach(category => {
      const matches = !normalized || category.dataset.searchCategory.includes(normalized);
      category.classList.toggle("filtered-out", !matches);
      if (normalized && matches) category.open = true;
    });
  }

  function readSearchTermsFromEditor() {
    const updated = {};
    document.querySelectorAll("[data-search-terms-category]").forEach(textarea => {
      const category = textarea.dataset.searchTermsCategory;
      const phrases = textarea.value
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean);
      updated[category] = phrases;
    });
    return sanitizeSearchTerms(updated, state.baseSearchTerms || DEFAULT_PRODUCT_SEARCH_TERMS);
  }

  function saveSearchTerms() {
    const message = document.getElementById("searchDictionaryMessage");
    try {
      state.searchTerms = readSearchTermsFromEditor();
      localStorage.setItem(SEARCH_TERMS_OVERRIDE_KEY, JSON.stringify(state.searchTerms));
      document.getElementById("adminSearchStatus").textContent = "Używany jest słownik zapisany w tej przeglądarce";
      document.querySelector(".status-dot").classList.add("active");
      renderNavigation();
      message.innerHTML = alertBox("Frazy zostały zapisane i wyszukiwarka już z nich korzysta.", "success");
      showToast("Zapisano słownik wyszukiwarki");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
    }
  }

  function downloadSearchTermsJson() {
    const terms = readSearchTermsFromEditor();
    const data = JSON.stringify(terms, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: "application/json;charset=utf-8" }));
    link.download = "search-terms.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importSearchTerms(event) {
    const file = event.target.files[0];
    if (!file) return;
    const message = document.getElementById("searchDictionaryMessage");
    try {
      const imported = JSON.parse(await file.text());
      if (!isValidSearchTermsFile(imported)) throw new Error("Wybrany plik nie ma prawidłowej struktury słownika.");
      state.searchTerms = sanitizeSearchTerms(imported, state.baseSearchTerms || DEFAULT_PRODUCT_SEARCH_TERMS);
      localStorage.setItem(SEARCH_TERMS_OVERRIDE_KEY, JSON.stringify(state.searchTerms));
      renderNavigation();
      renderSearchAdmin();
      showToast("Wczytano search-terms.json");
    } catch (error) {
      message.innerHTML = alertBox(error.message || String(error), "error");
      event.target.value = "";
    }
  }

  function resetSearchTerms() {
    if (!window.confirm("Przywrócić frazy zapisane w pliku data/search-terms.json?")) return;
    localStorage.removeItem(SEARCH_TERMS_OVERRIDE_KEY);
    state.searchTerms = deepClone(state.baseSearchTerms || DEFAULT_PRODUCT_SEARCH_TERMS);
    renderNavigation();
    renderSearchAdmin();
    showToast("Przywrócono słownik z serwera");
  }

  function lockSearchAdmin() {
    state.adminUnlocked = false;
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch {}
    renderSearchAdmin();
  }

  function renderBusinessCards() {
    const p = state.prices.wizytowki;
    content.innerHTML = `${header("Wizytówki 24h")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Format</label><select id="bcFormat">${options(p.formaty)}</select></div>
      <div class="field half"><label>Rodzaj druku</label><select id="bcPrint">${options(["Cyfrowy 24h", "Offsetowy"])}</select></div>
      <div class="field half"><label>Wykończenie</label><select id="bcFinish"></select></div>
      <div class="field half"><label>Zadruk</label><select id="bcSides"></select></div>
      <div class="field"><label>Nakład</label><select id="bcQuantity"></select></div>
    </div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const print = document.getElementById("bcPrint"), finish = document.getElementById("bcFinish"), sides = document.getElementById("bcSides"), qty = document.getElementById("bcQuantity");
    function refresh() {
      if (print.value === "Cyfrowy 24h") {
        finish.innerHTML = options(Object.keys(C.DIGITAL_FINISH_KEYS)); sides.innerHTML = options(["Jednostronne", "Dwustronne"]); sides.disabled = false;
        qty.innerHTML = options(Object.keys(p.cyfrowe[C.DIGITAL_FINISH_KEYS[finish.value]]));
      } else {
        finish.innerHTML = options(Object.keys(C.OFFSET_FINISH_KEYS)); sides.innerHTML = options(["Dwustronne"]); sides.disabled = true;
        qty.innerHTML = options(Object.keys(p.offsetowe[C.OFFSET_FINISH_KEYS[finish.value]]));
      }
    }
    print.addEventListener("change", refresh); finish.addEventListener("change", () => {
      const root = print.value === "Cyfrowy 24h" ? p.cyfrowe[C.DIGITAL_FINISH_KEYS[finish.value]] : p.offsetowe[C.OFFSET_FINISH_KEYS[finish.value]];
      qty.innerHTML = options(Object.keys(root));
    }); refresh();
    document.getElementById("calculate").addEventListener("click", () => { try {
      const price = C.calculateBusinessCards(state.prices, print.value, finish.value, Number(qty.value), sides.value);
      showQuote({ title: "Wizytówki 24h", description: `${value("bcFormat")}, druk ${print.value.toLowerCase()}, ${finish.value}, ${sides.value.toLowerCase()}, ${qty.value} szt.`, price, details: [["Format", value("bcFormat")], ["Nakład", `${qty.value} szt.`]] });
    } catch (e) { setResultError(e); } });
  }

  function renderFlyers() {
    const root = state.prices.ulotki;
    content.innerHTML = `${header("Ulotki 24h", "Papier 130 g, kolor dwustronny")}<div class="card"><div class="form-grid">
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
      showQuote({ title: "Ulotki 24h", description: `${print.value}, ${variant.value}, format ${format.value}, ${qty.value} szt.`, price, details: [["Papier", "130 g"], ["Zadruk", "Kolor dwustronny"]] });
    } catch (e) { setResultError(e); } });
  }

  function renderBanners() {
    const root = state.prices.banery;
    content.innerHTML = `${header("Folie i banery 24h", "Realizacja standardowa: 24h")}<div class="card"><div class="form-grid">
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
      const rows = tiers.length
        ? tiers.map(t => {
            const label = t.maks_m2 == null ? `powyżej ${previous} m²` : previous === 0 ? `do ${t.maks_m2} m²` : `powyżej ${previous} do ${t.maks_m2} m²`;
            previous = t.maks_m2 ?? previous;
            return `<tr><td>${label}</td><td>${money(t.cena_m2)} zł/m²</td></tr>`;
          }).join("")
        : `<tr><td>Każda powierzchnia</td><td>${money(data.cena_m2)} zł/m²</td></tr>`;
      document.getElementById("tierTable").innerHTML = `<table class="tier-table"><thead><tr><th>Powierzchnia</th><th>Cena</th></tr></thead><tbody>${rows}</tbody></table>`;
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
    content.innerHTML = `${header("Plakaty 24h")}<div class="card"><div class="form-grid">
      <div class="field half"><label>Rodzaj druku</label><select id="posterPrint">${options(Object.keys(root))}</select></div>
      <div class="field half"><label>Format</label><select id="posterFormat"></select></div>
      <div class="field"><label id="posterQtyLabel">Nakład</label><span id="posterQtyWrap"></span></div>
    </div><div id="posterInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const print = document.getElementById("posterPrint");
    const format = document.getElementById("posterFormat");
    const wrap = document.getElementById("posterQtyWrap");
    const info = document.getElementById("posterInfo");

    function refreshFormats() {
      format.innerHTML = options(Object.keys(root[print.value]));
      refreshQty();
    }

    function refreshQty() {
      if (print.value === "Wielkoformatowy 24h") {
        wrap.innerHTML = `<input id="posterQty" type="number" min="1" step="1" value="1">`;
        const tiers = root[print.value][format.value].progi_ilosciowe || [];
        const rows = tiers.map((tier, index) => {
          const next = tiers[index + 1];
          const range = next
            ? (Number(tier.min_szt) === Number(next.min_szt) - 1
              ? `${tier.min_szt} szt.`
              : `${tier.min_szt}–${Number(next.min_szt) - 1} szt.`)
            : `od ${tier.min_szt} szt.`;
          return `<tr><td>${esc(range)}</td><td>${money(tier.cena_sztuki)} zł/szt.</td></tr>`;
        }).join("");
        info.innerHTML = `<details><summary>Cennik wielkoformatowy 24h</summary><table class="tier-table"><thead><tr><th>Nakład</th><th>Cena jednostkowa</th></tr></thead><tbody>${rows}</tbody></table></details>`;
      } else {
        wrap.innerHTML = `<select id="posterQty">${options(Object.keys(root[print.value][format.value]))}</select>`;
        info.innerHTML = "";
      }
    }

    print.addEventListener("change", refreshFormats);
    format.addEventListener("change", refreshQty);
    refreshFormats();

    document.getElementById("calculate").addEventListener("click", () => { try {
      const q = numberValue("posterQty");
      const result = C.calculatePosters(state.prices, print.value, format.value, q);
      const paper = print.value === "Wielkoformatowy 24h" ? "Papier satynowy 135 g" : "Papier 170 g, kolor jednostronny";
      const details = [["Materiał", paper]];
      if (result && typeof result === "object") {
        details.push(["Cena jednostkowa", `${money(result.unitPrice)} zł`]);
      }
      showQuote({
        title: "Plakaty 24h",
        description: `${print.value}, format ${format.value}, ${q} szt.`,
        price: result && typeof result === "object" ? result.price : result,
        details
      });
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
    content.innerHTML = `${header("PCV i pianki")}<div class="card"><div class="form-grid">
      <div class="field"><label>Rodzaj produktu</label><select id="pvcProduct">${options(Object.keys(root))}</select></div>
      <div id="pvcDynamic" class="field" style="display:contents"></div>
    </div><div id="pvcInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;

    const product = document.getElementById("pvcProduct");
    const dynamic = document.getElementById("pvcDynamic");
    const info = document.getElementById("pvcInfo");

    function renderPvcFields(data) {
      dynamic.innerHTML = `
        <div class="field half"><label>Grubość płyty</label><select id="pvcThickness">${options(Object.keys(data.grubosci))}</select></div>
        <div class="field third"><label>Szerokość jednej sztuki [cm]</label><input id="pvcWidth" type="number" min="0.1" step="1" value="100"></div>
        <div class="field third"><label>Wysokość jednej sztuki [cm]</label><input id="pvcHeight" type="number" min="0.1" step="1" value="50"></div>
        <div class="field third"><label>Ilość sztuk</label><input id="pvcQty" type="number" min="1" step="1" value="1"></div>`;

      const thickness = document.getElementById("pvcThickness");
      function refreshInfo() {
        const tiers = data.grubosci[thickness.value].progi_cenowe_m2;
        const rows = tiers.map((tier, index) => {
          const range = index === 0 ? "Poniżej 2 m²" : tier.maks_m2 == null ? "Powyżej 5 m²" : "Od 2 do 5 m²";
          return `<tr><td>${range}</td><td>${money(tier.cena_m2)} zł/m²</td></tr>`;
        }).join("");
        info.innerHTML = `<details open><summary>Cennik dla grubości ${esc(thickness.value)}</summary><table class="tier-table"><tbody>${rows}</tbody></table></details>`;
      }
      thickness.addEventListener("change", refreshInfo);
      refreshInfo();
    }

    function renderFoamFields(data) {
      const formatNames = Object.keys(data.formaty);
      dynamic.innerHTML = `
        <div class="field half"><label>Sposób wyboru wymiaru</label><select id="foamMode">${options(["Format z cennika", "Inny wymiar"])}</select></div>
        <div class="field half" id="foamFormatField"><label>Format</label><select id="foamFormat">${options(formatNames)}</select></div>
        <div id="foamCustomFields" class="field" style="display:contents"></div>
        <div class="field"><label>Ilość sztuk</label><input id="pvcQty" type="number" min="1" step="1" value="1"></div>`;

      const mode = document.getElementById("foamMode");
      const formatField = document.getElementById("foamFormatField");
      const customFields = document.getElementById("foamCustomFields");
      const rows = Object.entries(data.formaty).map(([name, item]) => `<tr><td>${esc(name)}</td><td>${money(item.cena_sztuki)} zł/szt.</td></tr>`).join("");
      info.innerHTML = `${alertBox("Możliwe są również inne wymiary. Są rozliczane według najmniejszego formatu z cennika, w którym plansza się mieści.", "info")}<details open><summary>Cennik plansz z pianki 5 mm</summary><table class="tier-table"><thead><tr><th>Format</th><th>Cena brutto</th></tr></thead><tbody>${rows}</tbody></table></details>`;

      function refreshMode() {
        const custom = mode.value === "Inny wymiar";
        formatField.classList.toggle("hidden", custom);
        customFields.innerHTML = custom ? `
          <div class="field half"><label>Szerokość planszy [cm]</label><input id="pvcWidth" type="number" min="0.1" step="0.1" value="60"></div>
          <div class="field half"><label>Wysokość planszy [cm]</label><input id="pvcHeight" type="number" min="0.1" step="0.1" value="80"></div>` : "";
      }
      mode.addEventListener("change", refreshMode);
      refreshMode();
    }

    function refreshProduct() {
      const data = root[product.value];
      if (data.grubosci) renderPvcFields(data);
      else if (data.formaty) renderFoamFields(data);
    }

    product.addEventListener("change", refreshProduct);
    refreshProduct();

    document.getElementById("calculate").addEventListener("click", () => { try {
      const data = root[product.value];
      const quantity = numberValue("pvcQty");

      if (data.grubosci) {
        const thickness = value("pvcThickness");
        const result = C.calculatePvc(state.prices, numberValue("pvcWidth"), numberValue("pvcHeight"), quantity, product.value, thickness);
        showQuote({ title: "Folia z nadrukiem + PCV", description: `${product.value}, płyta ${thickness}, ${value("pvcWidth")} × ${value("pvcHeight")} cm, ${quantity} szt.`, price: result.price, details: [["Łączna powierzchnia", `${num(result.totalArea)} m²`], ["Cena za m²", `${money(result.unitPrice)} zł`], ["Minimum zamówienia", `${money(result.minimumOrder)} zł`]] });
        return;
      }

      const mode = value("foamMode");
      if (mode === "Format z cennika") {
        const formatName = value("foamFormat");
        const result = C.calculateFoamBoardStandard(state.prices, product.value, formatName, quantity);
        showQuote({ title: "Plansza pianka 5 mm", description: `${formatName}, ${quantity} szt.`, price: result.price, details: [["Grubość", data.grubosc], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
      } else {
        const width = numberValue("pvcWidth");
        const height = numberValue("pvcHeight");
        const result = C.calculateFoamBoardCustom(state.prices, product.value, width, height, quantity);
        showQuote({ title: "Plansza pianka 5 mm", description: `${width} × ${height} cm, ${quantity} szt.`, price: result.price, details: [["Grubość", data.grubosc], ["Format rozliczeniowy", result.billing.formatName], ["Sposób rozliczenia", result.billing.billingMethod], ["Cena jednostkowa", `${money(result.unitPrice)} zł`]] });
      }
    } catch (e) { setResultError(e); } });
  }

  function renderDigital() {
    const root = state.prices.druk_cyfrowy_i_ksero;
    const imposition = root.arkuszowanie || {};
    const services = ["Druk cyfrowy", "Ksero i druk", "Ksero książki", "Dla studentów", "Skanowanie", "Arkuszowanie SRA4/SRA3"];
    content.innerHTML = `${header("Druk cyfrowy 24h, ksero i arkuszowanie")}<div class="card"><div class="form-grid">
      <div class="field"><label>Rodzaj usługi</label><select id="digService">${options(services)}</select></div>
      <div id="digitalDynamic" class="field" style="display:contents"></div>
    </div><div id="digitalInfo"></div><div class="actions"><button class="button" id="calculate">Oblicz cenę</button></div></div><div id="quoteArea"></div>`;
    const service = document.getElementById("digService"), dynamic = document.getElementById("digitalDynamic");
    const standardPapers = ["Standardowy 80 g", "Papier kredowy 130 g", "Papier kredowy 170 g", "Papier kredowy 250 g", "Papier kredowy 300 g", "Papier kredowy 350 g"];
    const blackPapers = ["Standardowy 80 g", "Papier kolorowy", "Papier etykietowy", ...standardPapers.slice(1)];
    const impositionPapers = imposition.papiery || standardPapers.filter(name => ["130 g", "170 g", "250 g", "300 g"].some(weight => name.includes(weight)));

    function refresh() {
      let html = "", note = "";
      if (service.value === "Arkuszowanie SRA4/SRA3") {
        const sheetFormats = Object.keys(imposition.formaty_arkuszy || {});
        const bleed = Number(imposition.domyslny_spad_mm ?? 3);
        const margin = Number(imposition.margines_arkusza_mm ?? 3);
        html = `<div class="field third"><label>Szerokość netto [mm]</label><input id="digWidth" type="number" min="1" step="1" value="100"></div>
          <div class="field third"><label>Wysokość netto [mm]</label><input id="digHeight" type="number" min="1" step="1" value="50"></div>
          <div class="field third"><label>Liczba gotowych sztuk</label><input id="digQty" type="number" min="1" step="1" value="100"></div>
          <div class="field half"><label>Rodzaj druku</label><select id="digColor">${options(Object.keys(root.druk_cyfrowy), "Kolorowy")}</select></div>
          <div class="field half"><label>Zadruk</label><select id="digSide">${options(Object.keys(root.mnozniki_zadruku), "Jednostronny")}</select></div>
          <div class="field half"><label>Papier</label><select id="digPaper">${options(impositionPapers)}</select></div>
          <div class="field half"><label>Arkusz</label><select id="digSheet">${options(["Automatycznie", ...sheetFormats])}</select></div>`;
        note = `Kalkulator dodaje ${bleed} mm spadu z każdej strony, uwzględnia ${margin} mm marginesu arkusza i porównuje układ na SRA4 oraz SRA3. Cena korzysta z aktualnego cennika druku cyfrowego.`;
      } else if (service.value === "Druk cyfrowy") {
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
      dynamic.innerHTML = html;
      document.getElementById("digitalInfo").innerHTML = alertBox(note, "info");
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
      const s = service.value;

      if (s === "Arkuszowanie SRA4/SRA3") {
        const widthMm = numberValue("digWidth");
        const heightMm = numberValue("digHeight");
        const quantity = numberValue("digQty");
        const color = value("digColor");
        const side = value("digSide");
        const paper = value("digPaper");
        const sheetChoice = value("digSheet");
        const result = C.calculateDigitalImposition(state.prices, widthMm, heightMm, quantity, paper, color, side, sheetChoice);
        const comparisonRows = result.comparisons.map(item => `<tr class="${item.sheetFormat === result.sheetFormat ? "is-selected" : ""}">
          <td>${esc(item.sheetFormat)}${item.sheetFormat === result.recommendedFormat ? " — polecany" : ""}</td>
          <td>${item.piecesPerSheet}</td>
          <td>${item.sheets}</td>
          <td>${money(item.price)} zł</td>
        </tr>`).join("");
        document.getElementById("digitalInfo").innerHTML = `${alertBox(`Wybrany układ: ${result.sheetFormat}. Format polecany na podstawie ceny i liczby arkuszy: ${result.recommendedFormat}.`, "success")}
          <details open><summary>Porównanie SRA4 i SRA3</summary><div class="table-scroll"><table class="tier-table comparison-table"><thead><tr><th>Arkusz</th><th>Użytków/ark.</th><th>Arkuszy</th><th>Cena</th></tr></thead><tbody>${comparisonRows}</tbody></table></div></details>`;
        showQuote({
          title: "Arkuszowanie druku cyfrowego",
          description: `${widthMm} × ${heightMm} mm, ${quantity} szt., ${paper}, ${color.toLowerCase()}, ${side.toLowerCase()}`,
          price: result.price,
          details: [
            ["Wymiar netto", `${num(result.netWidthMm, 0)} × ${num(result.netHeightMm, 0)} mm`],
            ["Wymiar ze spadem", `${num(result.productionWidthMm, 0)} × ${num(result.productionHeightMm, 0)} mm`],
            ["Spad", `${num(result.bleedMm, 0)} mm z każdej strony`],
            ["Arkusz", `${result.sheetFormat} — ${num(result.sheetWidthMm, 0)} × ${num(result.sheetHeightMm, 0)} mm`],
            ["Pole zadruku", `${num(result.usableWidthMm, 0)} × ${num(result.usableHeightMm, 0)} mm`],
            ["Układ", result.layoutDescription],
            ["Użytków na arkuszu", String(result.piecesPerSheet)],
            ["Potrzebne arkusze", String(result.sheets)],
            ["Łącznie wykonanych sztuk", String(result.totalPieces)],
            ["Dodatkowych sztuk", String(result.extraPieces)],
            ["Papier", paper],
            ["Próg cenowy druku", result.tier],
            ["Cena za zamówioną sztukę", `${money(result.pricePerOrderedPiece)} zł`]
          ]
        });
        return;
      }

      const color = value("digColor"), q = numberValue("digQty");
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
