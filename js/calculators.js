(function (global) {
  "use strict";

  const NO_PRINT = "Brak";
  const DIGITAL_FINISH_KEYS = {
    "Standard": "standard",
    "Folia Soft Touch lub błysk": "folia_soft_touch_lub_blysk"
  };
  const OFFSET_FINISH_KEYS = {
    "Standard dwustronne": "standard_dwustronne",
    "Foliowane błysk lub Soft Touch": "foliowane_blysk_lub_soft_touch",
    "Złocenie lub srebrzenie + Soft Touch": "zlocenie_lub_srebrzenie_plus_soft_touch",
    "Lakier UV 3D + Soft Touch": "lakier_uv_3d_plus_soft_touch"
  };
  const SIDE_KEYS = { "Jednostronne": "jednostronne", "Dwustronne": "dwustronne" };

  function assertPositive(value, label) {
    if (!(Number(value) > 0)) throw new Error(`${label} musi być większa od zera.`);
  }

  function round2(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function getBannerPricePerM2(totalArea, material, bannerData, prices) {
    assertPositive(totalArea, "Łączna powierzchnia");
    const data = bannerData || prices.banery[material];
    const tiers = data.progi_cenowe || [];
    for (const tier of tiers) {
      if (tier.maks_m2 == null || totalArea <= Number(tier.maks_m2)) return Number(tier.cena_m2);
    }
    return Number(data.cena_m2);
  }

  function calculateBanner(prices, widthCm, heightCm, quantity, material) {
    assertPositive(widthCm, "Szerokość");
    assertPositive(heightCm, "Wysokość");
    assertPositive(quantity, "Ilość");
    const data = prices.banery[material];
    const areaOne = Number(widthCm) / 100 * Number(heightCm) / 100;
    const totalArea = areaOne * Number(quantity);
    const unitPrice = getBannerPricePerM2(totalArea, material, data, prices);
    const price = Math.max(totalArea * unitPrice, Number(data.minimum_zamowienia || 0));
    return { price: round2(price), areaOne, totalArea, unitPrice, minimumOrder: Number(data.minimum_zamowienia || 0) };
  }

  function calculateBusinessCards(prices, printType, finish, quantity, sides) {
    const q = String(quantity);
    let value;
    if (printType === "Cyfrowy 24h") {
      value = prices.wizytowki.cyfrowe[DIGITAL_FINISH_KEYS[finish]][q][SIDE_KEYS[sides]];
    } else if (printType === "Offsetowy") {
      value = prices.wizytowki.offsetowe[OFFSET_FINISH_KEYS[finish]][q];
    } else throw new Error("Nieobsługiwany rodzaj druku.");
    return round2(value);
  }

  function calculateFlyers(prices, printType, variant, formatName, quantity) {
    assertPositive(quantity, "Nakład");
    return round2(prices.ulotki[printType][variant][formatName][String(quantity)]);
  }

  function roundUpToStep(value, step) {
    return Math.ceil((Number(value) / Number(step)) - 1e-9) * Number(step);
  }

  function getStickerPricePerLinearMeter(billedLengthM, productData) {
    assertPositive(billedLengthM, "Długość rozliczeniowa");
    const tiers = productData.progi_cenowe_mb || [];
    for (const tier of tiers) {
      if (tier.maks_mb == null || billedLengthM <= Number(tier.maks_mb)) {
        return Number(tier.cena_mb);
      }
    }
    return Number(productData.cena_m2);
  }

  function calculateStickers(prices, productType, quantity, widthMm, heightMm) {
    assertPositive(quantity, "Ilość");
    const data = prices.naklejki;
    if (Object.prototype.hasOwnProperty.call(data.powierzchniowe, productType)) {
      assertPositive(widthMm, "Szerokość");
      assertPositive(heightMm, "Wysokość");
      const product = data.powierzchniowe[productType];
      const marginMm = 3;
      const maxPrintWidthMm = 1000;
      const rollWidthMm = 1000;
      const productionWidthMm = Number(widthMm) + marginMm;
      const productionHeightMm = Number(heightMm) + marginMm;
      if (productionWidthMm > maxPrintWidthMm) {
        throw new Error("Naklejka po dodaniu 3 mm przekracza maksymalną szerokość folii 1000 mm.");
      }
      const stickersPerRow = Math.floor(maxPrintWidthMm / productionWidthMm);
      if (stickersPerRow < 1) throw new Error("Na szerokości 1000 mm nie mieści się ani jedna naklejka.");
      const rows = Math.ceil(Number(quantity) / stickersPerRow);
      const totalStickers = stickersPerRow * rows;
      const extraStickers = totalStickers - Number(quantity);
      const baseLengthM = rows * productionHeightMm / 1000;
      const minimumM2 = Number(product.minimum_m2);
      const rollWidthM = rollWidthMm / 1000;
      const minimumLengthM = minimumM2 / rollWidthM;
      const requiredLengthM = Math.max(baseLengthM, minimumLengthM);
      const billedLengthM = roundUpToStep(requiredLengthM, 0.1);
      const pricePerLinearMeter = getStickerPricePerLinearMeter(billedLengthM, product);
      return {
        price: round2(billedLengthM * pricePerLinearMeter),
        pricePerLinearMeter,
        baseLengthM,
        billedLengthM,
        minimumLengthM,
        productionWidthMm,
        productionHeightMm,
        stickersPerRow,
        rows,
        totalStickers,
        extraStickers,
        layoutWidthMm: stickersPerRow * productionWidthMm,
        actualAreaM2: Number(widthMm) * Number(heightMm) * Number(quantity) / 1_000_000,
        productionAreaM2: productionWidthMm * productionHeightMm * totalStickers / 1_000_000
      };
    }
    if (Object.prototype.hasOwnProperty.call(data.taxi, productType)) {
      const unitPrice = Number(data.taxi[productType].cena_sztuki);
      return { price: round2(unitPrice * Number(quantity)), unitPrice };
    }
    throw new Error("Nieobsługiwany rodzaj produktu.");
  }

  function calculatePosters(prices, printType, formatName, quantity) {
    assertPositive(quantity, "Ilość");
    const root = prices.plakaty[printType];
    return round2(printType === "Wielkoformatowy" ? Number(root[formatName]) * Number(quantity) : root[formatName][String(quantity)]);
  }

  function getQuantityUnitPrice(quantity, tiers) {
    assertPositive(quantity, "Ilość");
    const sorted = [...(tiers || [])].sort((a, b) => Number(a.min_szt) - Number(b.min_szt));
    let selected = null;
    for (const tier of sorted) {
      if (Number(quantity) >= Number(tier.min_szt)) selected = tier;
    }
    if (!selected) throw new Error("Nie znaleziono progu cenowego dla wybranej ilości.");
    return selected;
  }

  function calculateRollup(prices, productType, size, quantity) {
    assertPositive(quantity, "Ilość");
    const data = prices.rollup[productType]?.[size];
    if (!data) throw new Error("Nie znaleziono wybranego wariantu roll-upu.");
    const tier = getQuantityUnitPrice(Number(quantity), data.progi_ilosciowe);
    const unitPrice = Number(tier.cena_sztuki);
    return { price: round2(unitPrice * Number(quantity)), unitPrice, tierMinQuantity: Number(tier.min_szt) };
  }

  function getPvcPricePerM2(totalArea, thicknessData) {
    assertPositive(totalArea, "Łączna powierzchnia");
    const tiers = thicknessData?.progi_cenowe_m2 || [];
    for (const tier of tiers) {
      if (tier.maks_m2 == null) return Number(tier.cena_m2);
      const max = Number(tier.maks_m2);
      const matches = tier.maks_wlacznie === false ? totalArea < max : totalArea <= max;
      if (matches) return Number(tier.cena_m2);
    }
    throw new Error("Nie znaleziono progu cenowego PCV.");
  }

  function calculatePvc(prices, widthCm, heightCm, quantity, productType, thickness) {
    assertPositive(widthCm, "Szerokość");
    assertPositive(heightCm, "Wysokość");
    assertPositive(quantity, "Ilość");
    const data = prices.pvc[productType];
    const thicknessData = data?.grubosci?.[thickness];
    if (!thicknessData) throw new Error("Nie znaleziono wybranej grubości płyty.");
    const totalArea = Number(widthCm) / 100 * Number(heightCm) / 100 * Number(quantity);
    const unitPrice = getPvcPricePerM2(totalArea, thicknessData);
    const minimumOrder = Number(data.minimum_zamowienia || 0);
    return { price: round2(Math.max(totalArea * unitPrice, minimumOrder)), totalArea, unitPrice, minimumOrder };
  }

  function fitItemsInLine(availableMm, itemMm, gapMm) {
    if (availableMm <= 0 || itemMm <= 0) return 0;
    return Math.max(0, Math.floor((Number(availableMm) + Number(gapMm) + 1e-9) / (Number(itemMm) + Number(gapMm))));
  }

  function getBestSheetLayout(usableWidthMm, usableHeightMm, itemWidthMm, itemHeightMm, gapMm = 0) {
    const orientations = [
      { name: "bez obrotu", width: Number(itemWidthMm), height: Number(itemHeightMm) },
      { name: "obrócone 90°", width: Number(itemHeightMm), height: Number(itemWidthMm) }
    ];
    const candidates = [];

    const perRow = orientations.map(item => fitItemsInLine(usableWidthMm, item.width, gapMm));
    const maxRows = orientations.map(item => fitItemsInLine(usableHeightMm, item.height, gapMm));

    for (let rowsA = 0; rowsA <= maxRows[0]; rowsA += 1) {
      for (let rowsB = 0; rowsB <= maxRows[1]; rowsB += 1) {
        const rowCount = rowsA + rowsB;
        if (!rowCount) continue;
        const usedHeight = rowsA * orientations[0].height + rowsB * orientations[1].height + Math.max(0, rowCount - 1) * Number(gapMm);
        if (usedHeight > Number(usableHeightMm) + 1e-9) continue;
        const count = rowsA * perRow[0] + rowsB * perRow[1];
        if (!count) continue;
        const mixed = rowsA > 0 && rowsB > 0;
        const description = mixed
          ? `Układ mieszany: ${rowsA} rz. bez obrotu + ${rowsB} rz. obróconych`
          : rowsA > 0
            ? `${rowsA} rz. bez obrotu`
            : `${rowsB} rz. obróconych 90°`;
        candidates.push({ count, description, mixed, method: "rows" });
      }
    }

    const perColumn = orientations.map(item => fitItemsInLine(usableHeightMm, item.height, gapMm));
    const maxColumns = orientations.map(item => fitItemsInLine(usableWidthMm, item.width, gapMm));

    for (let columnsA = 0; columnsA <= maxColumns[0]; columnsA += 1) {
      for (let columnsB = 0; columnsB <= maxColumns[1]; columnsB += 1) {
        const columnCount = columnsA + columnsB;
        if (!columnCount) continue;
        const usedWidth = columnsA * orientations[0].width + columnsB * orientations[1].width + Math.max(0, columnCount - 1) * Number(gapMm);
        if (usedWidth > Number(usableWidthMm) + 1e-9) continue;
        const count = columnsA * perColumn[0] + columnsB * perColumn[1];
        if (!count) continue;
        const mixed = columnsA > 0 && columnsB > 0;
        const description = mixed
          ? `Układ mieszany: ${columnsA} kol. bez obrotu + ${columnsB} kol. obróconych`
          : columnsA > 0
            ? `${columnsA} kol. bez obrotu`
            : `${columnsB} kol. obróconych 90°`;
        candidates.push({ count, description, mixed, method: "columns" });
      }
    }

    candidates.sort((a, b) => b.count - a.count || Number(a.mixed) - Number(b.mixed) || a.description.length - b.description.length);
    return candidates[0] || null;
  }

  function calculateDigitalSheetVariant(pricesRoot, sheetFormat, widthMm, heightMm, quantity, paperType, colorMode, sideMode) {
    const digital = pricesRoot.druk_cyfrowy_i_ksero;
    const imposition = digital.arkuszowanie;
    const sheet = imposition?.formaty_arkuszy?.[sheetFormat];
    if (!sheet) throw new Error(`Nie znaleziono konfiguracji arkusza ${sheetFormat}.`);

    const bleedMm = Number(imposition.domyslny_spad_mm ?? 3);
    const gapMm = Number(imposition.odstep_miedzy_uzytkami_mm ?? 0);
    const marginMm = Number(imposition.margines_arkusza_mm ?? 3);
    const productionWidthMm = Number(widthMm) + bleedMm * 2;
    const productionHeightMm = Number(heightMm) + bleedMm * 2;
    const usableWidthMm = Number(sheet.szerokosc_mm) - marginMm * 2;
    const usableHeightMm = Number(sheet.wysokosc_mm) - marginMm * 2;

    const layout = getBestSheetLayout(usableWidthMm, usableHeightMm, productionWidthMm, productionHeightMm, gapMm);
    if (!layout || layout.count < 1) {
      throw new Error(`Wymiar ${productionWidthMm} × ${productionHeightMm} mm po spadzie nie mieści się na arkuszu ${sheetFormat}.`);
    }

    const sheets = Math.ceil(Number(quantity) / layout.count);
    const totalPieces = sheets * layout.count;
    const extraPieces = totalPieces - Number(quantity);
    const priceResult = calculateDigital(
      pricesRoot,
      "Druk cyfrowy",
      colorMode,
      sheets,
      sheet.format_rozliczeniowy,
      paperType,
      sideMode
    );

    return {
      sheetFormat,
      sheetWidthMm: Number(sheet.szerokosc_mm),
      sheetHeightMm: Number(sheet.wysokosc_mm),
      usableWidthMm,
      usableHeightMm,
      billingFormat: sheet.format_rozliczeniowy,
      netWidthMm: Number(widthMm),
      netHeightMm: Number(heightMm),
      productionWidthMm,
      productionHeightMm,
      bleedMm,
      marginMm,
      gapMm,
      piecesPerSheet: layout.count,
      layoutDescription: layout.description,
      sheets,
      totalPieces,
      extraPieces,
      price: priceResult.price,
      tier: priceResult.tier,
      basePrice: priceResult.basePrice,
      paperSurcharge: priceResult.paperSurcharge,
      pricePerOrderedPiece: round2(priceResult.price / Number(quantity))
    };
  }

  function calculateDigitalImposition(pricesRoot, widthMm, heightMm, quantity, paperType, colorMode, sideMode, sheetChoice = "Automatycznie") {
    assertPositive(widthMm, "Szerokość netto");
    assertPositive(heightMm, "Wysokość netto");
    assertPositive(quantity, "Liczba gotowych sztuk");

    const imposition = pricesRoot.druk_cyfrowy_i_ksero.arkuszowanie;
    if (!imposition?.formaty_arkuszy) throw new Error("Brakuje konfiguracji arkuszowania w prices.json.");

    const comparisons = [];
    const errors = [];
    for (const sheetFormat of Object.keys(imposition.formaty_arkuszy)) {
      try {
        comparisons.push(calculateDigitalSheetVariant(pricesRoot, sheetFormat, widthMm, heightMm, quantity, paperType, colorMode, sideMode));
      } catch (error) {
        errors.push(error.message);
      }
    }

    if (!comparisons.length) throw new Error(errors[0] || "Podany format nie mieści się na żadnym arkuszu.");

    const ranked = [...comparisons].sort((a, b) => a.price - b.price || a.sheets - b.sheets || b.piecesPerSheet - a.piecesPerSheet);
    const recommended = ranked[0];
    const selected = sheetChoice === "Automatycznie"
      ? recommended
      : comparisons.find(item => item.sheetFormat === sheetChoice);

    if (!selected) throw new Error(`Podany format nie mieści się na arkuszu ${sheetChoice}.`);

    return {
      ...selected,
      comparisons,
      recommendedFormat: recommended.sheetFormat,
      isRecommended: selected.sheetFormat === recommended.sheetFormat
    };
  }

  function getQuantityTier(quantity, tierPrices = null) {
    assertPositive(quantity, "Ilość");

    if (tierPrices && typeof tierPrices === "object") {
      const value = Number(quantity);
      const parsedTiers = Object.keys(tierPrices).map(key => {
        const rangeMatch = String(key).match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
        if (rangeMatch) {
          return { key, min: Number(rangeMatch[1]), max: Number(rangeMatch[2]) };
        }

        const plusMatch = String(key).match(/^\s*(\d+)\s*\+\s*$/);
        if (plusMatch) {
          return { key, min: Number(plusMatch[1]), max: Infinity };
        }

        return null;
      }).filter(Boolean).sort((a, b) => a.min - b.min || a.max - b.max);

      const selected = parsedTiers.find(tier => value >= tier.min && value <= tier.max);
      if (selected) return selected.key;
      throw new Error("Nie znaleziono progu cenowego dla wybranej ilości.");
    }

    if (quantity <= 20) return "1-20";
    if (quantity <= 100) return "21-100";
    if (quantity <= 500) return "101-500";
    return "501+";
  }

  function calculateDigital(pricesRoot, service, colorMode, quantity, formatName = "A4", paperType = "Standardowy 80 g", sideMode = "Jednostronny") {
    assertPositive(quantity, "Ilość");
    const prices = pricesRoot.druk_cyfrowy_i_ksero;
    let total;
    if (service === "Druk cyfrowy" || service === "Ksero i druk") {
      const servicePrices = service === "Druk cyfrowy" ? prices.druk_cyfrowy : prices.ksero_i_druk;
      const sideMultiplier = service === "Druk cyfrowy" ? Number(prices.mnozniki_zadruku[sideMode]) : 1;
      const formatMultiplier = Number(prices.mnozniki_formatu[formatName]);
      const printUnits = Number(quantity) * sideMultiplier * formatMultiplier;
      const tierPrices = servicePrices[colorMode];
      const tier = getQuantityTier(printUnits, tierPrices);
      const basePrice = Number(tierPrices[tier]);
      const paperSurcharge = Number(prices.doplaty_do_papieru[paperType]);
      const printTotal = basePrice * printUnits;
      const paperUnits = Number(quantity) * formatMultiplier;
      const paperTotal = paperSurcharge * paperUnits;
      total = printTotal + paperTotal;
      return { price: round2(total), tier, printUnits, paperUnits, basePrice, paperSurcharge };
    }
    if (service === "Ksero książki") total = Number(prices.ksero_ksiazki[colorMode]) * Number(quantity);
    else if (service === "Dla studentów") total = Number(prices.dla_studentow[colorMode][formatName]) * Number(quantity);
    else if (service === "Skanowanie") total = Number(prices.skanowanie[colorMode]) * Number(quantity);
    else throw new Error("Nieobsługiwany rodzaj usługi.");
    return { price: round2(total) };
  }

  function getApparelDiscount(quantity, discounts) {
    assertPositive(quantity, "Ilość");
    const tiers = [...(discounts.progi_ilosciowe || [])].sort((a, b) => Number(a.min_szt) - Number(b.min_szt));
    let discount = 0;
    for (const tier of tiers) {
      if (Number(quantity) >= Number(tier.min_szt)) discount = Number(tier.rabat_proc);
    }
    return discount;
  }

  function normalizeSize(value) {
    return String(value).toLowerCase().replaceAll(" ", "").replaceAll("×", "x");
  }

  function findPrintOnlySize(selectedSize, printOnlyPrices) {
    if (Object.prototype.hasOwnProperty.call(printOnlyPrices, selectedSize)) return selectedSize;
    const normalized = normalizeSize(selectedSize);
    for (const dimension of ["10x15", "20x30", "35x40"]) {
      if (normalized.includes(dimension)) {
        const found = Object.keys(printOnlyPrices).find(key => normalizeSize(key).includes(dimension));
        if (found) return found;
      }
    }
    if (normalized.includes("standard")) {
      return Object.keys(printOnlyPrices).sort((a, b) => Number(printOnlyPrices[a]) - Number(printOnlyPrices[b]))[0];
    }
    throw new Error(`Nie można dopasować ceny dodatkowego nadruku dla wariantu: ${selectedSize}.`);
  }

  function calculateApparel(prices, category, product, front, back, quantity) {
    assertPositive(quantity, "Ilość");
    const root = prices.odziez_z_nadrukiem;
    const productData = root.produkty[category]?.[product];
    if (!productData) throw new Error("Nie znaleziono wybranego produktu.");
    const selected = [];
    if (front && front !== NO_PRINT) selected.push({ side: "Przód", size: front });
    if (back && back !== NO_PRINT) selected.push({ side: "Tył", size: back });
    if (!selected.length) throw new Error("Wybierz nadruk z przodu, z tyłu lub po obu stronach.");
    const base = selected[0];
    const baseUnitPrice = Number(productData.ceny[base.size]);
    if (!Number.isFinite(baseUnitPrice)) throw new Error("Nie znaleziono ceny wybranego rozmiaru nadruku.");
    let extraPrintPrice = 0;
    let matchedSize = null;
    if (selected.length > 1) {
      const printOnly = root.produkty["Sam nadruk"]["Nadruk na odzieży klienta"].ceny;
      matchedSize = findPrintOnlySize(selected[1].size, printOnly);
      extraPrintPrice = Number(printOnly[matchedSize]);
    }
    const unitPrice = baseUnitPrice + extraPrintPrice;
    const priceBeforeDiscount = unitPrice * Number(quantity);
    const discountPercent = getApparelDiscount(Number(quantity), root.rabaty || {});
    const discountAmount = priceBeforeDiscount * discountPercent / 100;
    return {
      price: round2(priceBeforeDiscount - discountAmount), unitPrice: round2(unitPrice), baseUnitPrice: round2(baseUnitPrice),
      extraPrintPrice: round2(extraPrintPrice), priceBeforeDiscount: round2(priceBeforeDiscount), discountPercent,
      discountAmount: round2(discountAmount), extraPrintMatchedSize: matchedSize
    };
  }

  function calculateWorkBinding(prices, pagesPerCopy, copies, colorMode, sideMode, bindingType, bindingVariant) {
    assertPositive(pagesPerCopy, "Liczba stron");
    assertPositive(copies, "Liczba egzemplarzy");
    const totalPrintedPages = Number(pagesPerCopy) * Number(copies);
    const tierPrices = prices.druk_cyfrowy_i_ksero.druk_cyfrowy[colorMode];
    const tier = getQuantityTier(totalPrintedPages, tierPrices);
    const printPricePerPage = Number(tierPrices[tier]);
    const printTotal = totalPrintedPages * printPricePerPage;
    const sheetsPerCopy = sideMode === "Dwustronny" ? Math.ceil(Number(pagesPerCopy) / 2) : Number(pagesPerCopy);
    const totalSheets = sheetsPerCopy * Number(copies);
    const bindingPricePerCopy = Number(prices.oprawa_prac.rodzaje_opraw[bindingType][bindingVariant]);
    const bindingTotal = bindingPricePerCopy * Number(copies);
    const price = printTotal + bindingTotal;
    return { price: round2(price), totalPrintedPages, tier, printPricePerPage, printTotal: round2(printTotal), sheetsPerCopy, totalSheets, bindingPricePerCopy, bindingTotal: round2(bindingTotal), pricePerCopy: round2(price / Number(copies)) };
  }

  function calculateLamination(prices, formatName, quantity) {
    assertPositive(quantity, "Ilość");
    const unitPrice = Number(prices.laminowanie.formaty[formatName]);
    return { price: round2(unitPrice * Number(quantity)), unitPrice, foilMicrons: Number(prices.laminowanie.folia_mikrony || 80) };
  }

  function parseCanvasFormat(formatKey) {
    const match = String(formatKey).match(/^\s*(\d+)\s*[x×]\s*(\d+)\s*$/);
    if (!match) throw new Error(`Nieprawidłowy format obrazu: ${formatKey}.`);
    return [Number(match[1]), Number(match[2])];
  }

  function getCanvasSuggestions(prices, imageWidth, imageHeight, minimumResults = 8) {
    assertPositive(imageWidth, "Szerokość obrazu");
    assertPositive(imageHeight, "Wysokość obrazu");
    const ratio = Number(imageWidth) / Number(imageHeight);
    const landscape = imageWidth > imageHeight;
    const portrait = imageHeight > imageWidth;
    const candidates = Object.entries(prices.obrazy_na_plotnie.formaty).map(([key, price]) => {
      const [a, b] = parseCanvasFormat(key);
      const small = Math.min(a, b), large = Math.max(a, b);
      const width = landscape ? large : portrait ? small : a;
      const height = landscape ? small : portrait ? large : b;
      const formatRatio = width / height;
      return { formatKey: key, displayWidthCm: width, displayHeightCm: height, price: Number(price), ratioErrorPercent: Math.abs(formatRatio - ratio) / ratio * 100, areaCm2: width * height };
    }).sort((a, b) => a.ratioErrorPercent - b.ratioErrorPercent || a.areaCm2 - b.areaCm2);
    if (!candidates.length) return [];
    const best = candidates[0].ratioErrorPercent;
    const bestMatches = candidates.filter(c => Math.abs(c.ratioErrorPercent - best) < 1e-9);
    return bestMatches.length >= 3 ? bestMatches : candidates.slice(0, Math.max(minimumResults, bestMatches.length));
  }

  function calculateProportionalCanvasSize(prices, imageWidth, imageHeight, knownSide, knownValueCm) {
    assertPositive(imageWidth, "Szerokość obrazu");
    assertPositive(imageHeight, "Wysokość obrazu");
    assertPositive(knownValueCm, "Podany wymiar");
    const ratio = Number(imageWidth) / Number(imageHeight);
    let width, height;
    if (knownSide === "Szerokość") { width = Number(knownValueCm); height = width / ratio; }
    else if (knownSide === "Wysokość") { height = Number(knownValueCm); width = height * ratio; }
    else throw new Error("Wybierz, czy podajesz szerokość czy wysokość.");
    width = Math.round(width * 10) / 10;
    height = Math.round(height * 10) / 10;
    const minSide = Number(prices.obrazy_na_plotnie.minimalny_bok_cm || 30);
    const maxSide = Number(prices.obrazy_na_plotnie.maksymalny_bok_cm || 150);
    if (Math.max(width, height) > maxSide) throw new Error(`Po zachowaniu proporcji najdłuższy bok ma ${Math.max(width, height).toFixed(1)} cm. Maksymalny bok to ${maxSide} cm.`);
    if (Math.min(width, height) < minSide) throw new Error(`Po zachowaniu proporcji krótszy bok ma ${Math.min(width, height).toFixed(1)} cm. Minimalny bok to ${minSide} cm.`);
    return { widthCm: width, heightCm: height };
  }

  function findCanvasBillingFormat(prices, widthCm, heightCm) {
    const requestedArea = Number(widthCm) * Number(heightCm);
    const candidates = [];
    for (const [key, price] of Object.entries(prices.obrazy_na_plotnie.formaty)) {
      const [a, b] = parseCanvasFormat(key);
      const orientations = [[a, b], [b, a]];
      for (const [w, h] of orientations) {
        const area = w * h;
        candidates.push({ formatKey: key, displayWidthCm: w, displayHeightCm: h, price: Number(price), areaCm2: area, areaDifference: Math.abs(area - requestedArea), dimensionDifference: Math.abs(w - widthCm) + Math.abs(h - heightCm), contains: w >= widthCm && h >= heightCm });
      }
    }
    const containing = candidates.filter(c => c.contains).sort((a, b) => a.areaCm2 - b.areaCm2 || a.dimensionDifference - b.dimensionDifference || a.price - b.price);
    if (containing.length) return { ...containing[0], billingMethod: "Najbliższy większy format z cennika" };
    candidates.sort((a, b) => a.dimensionDifference - b.dimensionDifference || a.areaDifference - b.areaDifference || a.price - b.price);
    return { ...candidates[0], billingMethod: "Najbliższy dostępny format z cennika" };
  }

  function calculateCanvasStandard(prices, formatKey, quantity) {
    assertPositive(quantity, "Ilość");
    const unitPrice = Number(prices.obrazy_na_plotnie.formaty[formatKey]);
    return { price: round2(unitPrice * Number(quantity)), unitPrice };
  }

  function calculateCanvasCustom(prices, widthCm, heightCm, quantity) {
    assertPositive(widthCm, "Szerokość obrazu");
    assertPositive(heightCm, "Wysokość obrazu");
    assertPositive(quantity, "Ilość");
    const minSide = Number(prices.obrazy_na_plotnie.minimalny_bok_cm || 30);
    const maxSide = Number(prices.obrazy_na_plotnie.maksymalny_bok_cm || 150);
    if (Math.min(Number(widthCm), Number(heightCm)) < minSide) throw new Error(`Minimalny bok obrazu to ${minSide} cm.`);
    if (Math.max(Number(widthCm), Number(heightCm)) > maxSide) throw new Error(`Maksymalny bok obrazu to ${maxSide} cm.`);
    const billing = findCanvasBillingFormat(prices, Number(widthCm), Number(heightCm));
    return { price: round2(billing.price * Number(quantity)), unitPrice: billing.price, billing };
  }

  global.Calculators = {
    NO_PRINT, DIGITAL_FINISH_KEYS, OFFSET_FINISH_KEYS,
    getBannerPricePerM2, calculateBanner, calculateBusinessCards, calculateFlyers,
    getStickerPricePerLinearMeter, calculateStickers,
    calculatePosters, calculateRollup, calculatePvc, calculateDigital, calculateDigitalImposition, calculateApparel, calculateWorkBinding,
    calculateLamination, getCanvasSuggestions, calculateProportionalCanvasSize, calculateCanvasStandard, calculateCanvasCustom,
    getQuantityTier, roundUpToStep
  };
})(window);
