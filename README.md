# NerdBook

Prywatny notes techniczny publikowany jako statyczna strona GitHub Pages. Interfejs łączy terminalowe intro z przeszukiwalnym handbookiem oraz runbookami Bettercap z kopiowaniem one-linerów.

## Model prywatności

GitHub Pages jest publicznym hostingiem. Dlatego NerdBook nie zapisuje notatek ani hasła w kodzie strony:

- szczegółowa treść notatek, komendy oraz indeks wyszukiwania są jednym zaszyfrowanym payloadem,
- szyfrowanie: AES-256-GCM,
- klucz: PBKDF2 / SHA-256 / 310 000 iteracji,
- odszyfrowanie odbywa się lokalnie przez Web Crypto,
- plaintext pozostaje tylko w pamięci bieżącej karty i znika po jej przeładowaniu lub kliknięciu „Zablokuj”,
- `private/` oraz `work/` są ignorowane przez Git i nie mogą trafić do publikowanego repozytorium.

Zaszyfrowany payload można pobrać i próbować łamać offline, dlatego fraza dostępu musi być długa, unikalna i nie może znajdować się w repozytorium.

Publiczne pozostają wyłącznie ogólne elementy interfejsu i nazwa kolekcji; właściwe notatki oraz polecenia są dostępne dopiero po lokalnym odszyfrowaniu.

## Uruchomienie lokalne

Wymagany jest Node.js 22.13 lub nowszy.

```bash
npm ci
npm run dev
```

Strona będzie dostępna pod adresem pokazanym przez serwer lokalny.

## Aktualizacja treści

### Edycja istniejącego sejfu

Najpierw odszyfruj dane do ignorowanego pliku `private/notes.json`:

```bash
NERDBOOK_PASSWORD='twoja-fraza' npm run vault:decrypt
```

Po edycji zaszyfruj je ponownie:

```bash
NERDBOOK_PASSWORD='twoja-fraza' npm run vault:encrypt
```

Do commita trafia wyłącznie `app/data/vault.json`.

### Ponowny import plików źródłowych

Importer oczekuje plików:

- `work/source-notes/NerdBook_IT_v0.1.docx`
- `work/source-notes/Bettercap_A5_Lab_Flows.txt`

Na macOS:

```bash
npm run notes:import
NERDBOOK_PASSWORD='twoja-fraza' npm run vault:encrypt
```

Importer używa systemowego `textutil` do odczytu DOCX. Ukryte separatory `U+2028` z notatki Bettercap są normalizowane, a kopiowane one-linery nie zawierają tych znaków.

## Zmiana frazy dostępu

```bash
NERDBOOK_PASSWORD='stara-fraza' npm run vault:decrypt
NERDBOOK_PASSWORD='nowa-dluga-unikalna-fraza' npm run vault:encrypt
```

Nie dodawaj frazy do plików `.env` przeznaczonych do commita, workflow GitHub Actions ani ustawień `NEXT_PUBLIC_*`.

## GitHub Pages

Workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) buduje statyczną wersję i publikuje katalog `out` po każdym pushu do `main`.

Jednorazowo w repozytorium GitHub wybierz:

1. **Settings → Pages**
2. **Build and deployment → Source → GitHub Actions**

Późniejsze commity do `main` będą publikowane automatycznie pod adresem:

`https://d3h420.github.io/NerdBook/`

Konfiguracja jest zgodna z [oficjalnym przepływem GitHub Pages dla własnych workflowów](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Kontrola jakości

```bash
npm run build
npm run build:pages
npm test
npm run lint
```

Test sprawdza między innymi, czy ekran blokady renderuje się poprawnie oraz czy jawne fragmenty notatek nie znajdują się w HTML-u ani w zaszyfrowanym pliku sejfu.

## Zasada LAB-u

Materiały Bettercap są przeznaczone wyłącznie do własnego, odizolowanego laboratorium lub systemów i sieci, dla których masz jednoznaczną zgodę. Pliki PCAP, logi, tokeny i inne przechwycone dane traktuj jak dane wrażliwe.
