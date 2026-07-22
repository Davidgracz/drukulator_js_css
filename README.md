# Drukulator 0.1.8v — GitHub Pages

Statyczna wersja kalkulatora Druk24. Nie wymaga Pythona ani Streamlit — działa w całości w przeglądarce.

## Publikacja na GitHub Pages

1. Utwórz nowe repozytorium na GitHubie, np. `drukulator`.
2. Wgraj **zawartość tego folderu** do głównego katalogu repozytorium. Plik `index.html` ma znajdować się bezpośrednio w katalogu głównym.
3. Otwórz repozytorium i przejdź do **Settings → Pages**.
4. W sekcji **Build and deployment** wybierz:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`
   - **Folder:** `/ (root)`
5. Kliknij **Save**.
6. Po publikacji strona będzie dostępna pod adresem zbliżonym do:
   `https://NAZWA-UZYTKOWNIKA.github.io/drukulator/`

## Lokalny test

Nie otwieraj `index.html` bezpośrednio dwuklikiem, ponieważ przeglądarka może zablokować odczyt `data/prices.json`.

W katalogu projektu uruchom:

```bash
python -m http.server 8000
```

Następnie otwórz:

```text
http://localhost:8000
```

## Zmiana cen

Wszystkie ceny znajdują się w:

```text
data/prices.json
```

Po zmianie cennika zapisz plik i wypchnij aktualizację do repozytorium. GitHub Pages opublikuje nową wersję.

## Co zostało przeniesione ze Streamlit

- wizytówki,
- ulotki,
- folie i banery z progami cenowymi,
- naklejki z wymiarami w mm,
- plakaty,
- roll-up i X-baner,
- PVC,
- druk cyfrowy, ksero i skanowanie,
- koszulki i odzież,
- druk i oprawa prac,
- laminowanie,
- obrazy na płótnie z analizą proporcji zdjęcia,
- koszyk,
- eksport CSV,
- formularz zamówienia i kopiowanie treści maila.

## Ważne ograniczenia

GitHub Pages jest hostingiem statycznym. Projekt nie wysyła zamówień, plików ani danych klientów na serwer. Formularz tworzy wyłącznie tekst do ręcznego skopiowania.

Do docelowej, komercyjnej strony firmowej lepszy będzie własny hosting, Cloudflare Pages albo inna usługa przeznaczona do stron biznesowych. GitHub Pages warto traktować jako wersję testową lub demonstracyjną.
