# Teoria B — Prawko Mobile

Mobilna aplikacja webowa/PWA-ready do nauki pytań na prawo jazdy, oparta na potwierdzonym ruchu API platformy Testy na Prawo Jazdy.

## Stack
- React 18 + TypeScript + Vite
- Node.js 20+ + Express
- Oryginalne API: `https://api.testynaprawojazdy.eu/eprawko-rest`

## Uruchomienie
1. Zainstaluj Node.js 20 lub nowszy.
2. Sklonuj repozytorium i uruchom `npm install`.
3. Skopiuj `.env.example` do `.env`.
4. Uruchom `npm run dev`.
   - frontend Vite: port 5173
   - backend Express: port 3001

Produkcja:
```bash
npm run build
NODE_ENV=production npm start
```
Express serwuje wtedy frontend z katalogu `dist`. Hosting musi obsługiwać Node.js i HTTPS. Sam GitHub Pages nie uruchomi backendu Express.

## Zaimplementowane endpointy upstream

Wszystkie żądania upstream wykonywane są po stronie serwera. Token `uuid` z logowania jest przechowywany po stronie backendu i przekazywany jako nagłówek `jsessionid`. Przeglądarka otrzymuje wyłącznie własne ciasteczko HttpOnly.

- `POST /login` — multipart/form-data: `userName`, `password`
- `POST /logout`
- `GET /student/{studentId}`
- `GET /questions/getModules/{category}`
- `PUT /learning/create/studentId/{studentId}/schoolId/{schoolId}/category/{category}/lang/{lang}/moduleId/{moduleId}`
- `POST /progress/seen`
- `GET /progress/learn/{studentId}`
- `GET /progress/learn/store/{studentId}/{moduleId}/{questionNumber}/{max}/{category}`
- `POST /exam`

Backend udostępnia aplikacji odpowiadające im endpointy `/api/*`.

## Ważne ograniczenia wynikające z przechwyconego API

- Rozpoczęcie egzaminu jest potwierdzone, ale wysyłanie odpowiedzi, kończenie egzaminu, historia i pobieranie wyniku nie zostały odnalezione. Aplikacja nie udaje, że te operacje działają.
- Odpowiedzi egzaminacyjne `correct` są usuwane z obiektów wysyłanych do przeglądarki.
- Nie ustalono hosta ani ścieżek multimediów. Interfejs pokazuje nazwę pliku, ale nie konstruuje zgadywanego URL.
- Nie ustalono czasu egzaminu ani pełnych zasad punktacji.
- Sesje backendu są przechowywane w pamięci procesu. Restart serwera wyloguje aktywnych użytkowników; przed większym wdrożeniem należy dodać współdzielony magazyn sesji.
- Rzeczywiste logowanie i komunikacja z upstream wymagają aktywnego konta platformy oraz dostępności jej API. Nie można potwierdzić działania na koncie użytkownika bez testu z jego danymi.

## Bezpieczeństwo
- Hasło nie jest zapisywane w aplikacji.
- Token upstream nie jest wysyłany do przeglądarki ani logowany.
- Cookie aplikacji ma flagę HttpOnly i SameSite=Lax; w produkcji również Secure.
- Nie commituj pliku `.env`.
