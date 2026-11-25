# Teoria B — Prawko Mobile

Mobilna aplikacja webowa (PWA-ready) do przygotowania do egzaminu teoretycznego na kategorię B.

## Technologie
- React 18 + TypeScript + Vite
- Node.js + Express
- Responsywny interfejs mobilny

## Uruchomienie lokalne
1. Zainstaluj Node.js 20 lub nowszy.
2. Sklonuj repozytorium i zainstaluj zależności:
   ```bash
   npm install
   ```
3. Skopiuj `.env.example` do `.env`.
4. Uzupełnij `UPSTREAM_API_BASE_URL`, ewentualny token oraz ścieżki endpointów zgodnie z dokumentacją dostawcy API.
5. Uruchom aplikację:
   ```bash
   npm run dev
   ```
   Vite uruchomi frontend, a Express API będzie działać na porcie 3001.

## Konfiguracja API
- `SCHOOL_ID=1000470` — identyfikator szkoły z wcześniejszych ustaleń.
- `UPSTREAM_API_BASE_URL` — bazowy adres API dostawcy.
- `UPSTREAM_API_TOKEN` — opcjonalny token Bearer.
- `UPSTREAM_LOGIN_PATH`, `UPSTREAM_QUESTIONS_PATH`, `UPSTREAM_EXAM_PATH` — ścieżki endpointów.

Backend udostępnia:
- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/questions`
- `POST /api/exam`

**Ważne:** repozytorium nie zawiera jeszcze potwierdzonej specyfikacji zewnętrznego API (adresu bazowego, metod, parametrów i formatów JSON). Dlatego proxy jest konfigurowalne, ale logowanie, pobieranie pytań i egzamin nie mogą być uczciwie oznaczone jako w pełni zintegrowane, dopóki nie zostanie podłączona i przetestowana dokumentacja API. Endpointy domyślne są ustawieniami startowymi, a nie potwierdzonym kontraktem dostawcy.

## Build i produkcja
```bash
npm run build
npm start
```
W trybie produkcyjnym Express serwuje pliki z katalogu `dist`. Ustaw `NODE_ENV=production`, `PORT` oraz silny `SESSION_SECRET` w środowisku hostingu.

## Status
- [x] Podstawowy interfejs mobilny i nawigacja
- [x] Backend Express i endpoint health
- [x] Konfigurowalne proxy do API
- [ ] Dopasowanie kontraktu API do dokumentacji dostawcy
- [ ] Testy end-to-end logowania, pytań i egzaminu
- [ ] Trwałe konta i synchronizacja postępów
