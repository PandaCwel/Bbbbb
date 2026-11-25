# Teoria B — Prawko Mobile

Aplikacja webowa do nauki pytań na prawo jazdy i próbnych egzaminów, oparta na API platformy Testy na Prawo Jazdy.

## Stack
- React 18 + TypeScript + Vite
- Node.js 20+ + Express
- API: `https://api.testynaprawojazdy.eu/eprawko-rest`

## Uruchomienie lokalne
1. Zainstaluj Node.js 20 lub nowszy.
2. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/PandaCwel/Bbbbb.git
   cd Bbbbb
   ```
3. Zainstaluj zależności:
   ```bash
   npm install
   ```
4. Skopiuj `.env.example` do `.env` (Windows: `copy .env.example .env`; macOS/Linux: `cp .env.example .env`).
5. Uruchom aplikację:
   ```bash
   npm run dev
   ```
6. Otwórz frontend pod adresem **http://localhost:5173**. Backend działa na porcie **3001**.

## Wdrożenie online (Render)
1. Zaloguj się na https://render.com przez GitHub.
2. Wybierz **New → Blueprint**.
3. Wskaż repozytorium `PandaCwel/Bbbbb`.
4. Render odczyta `render.yaml`, zbuduje projekt i uruchomi serwer.
5. Otwórz adres HTTPS podany przez Render.

Nie używaj GitHub Pages jako hostingu całej aplikacji — Pages nie uruchamia serwera Express, który bezpiecznie przechowuje sesję do API.

## Co jest zaimplementowane
- Logowanie przez oryginalny endpoint API; hasło nie jest zapisywane.
- Token upstream pozostaje po stronie serwera, przeglądarka otrzymuje własne cookie HttpOnly.
- Profil, lista modułów, nauka, oznaczanie pytań i zapisywanie postępu.
- Rozpoczęcie egzaminu przez `POST /exam`.
- Odpowiedzi egzaminacyjne są trzymane w interfejsie, a komplet obiektu egzaminu jest wysyłany przez `PUT /exam`.
- Klucz poprawnych odpowiedzi pozostaje po stronie backendu i nie jest wysyłany do przeglądarki w trybie egzaminu.
- Historia egzaminów: `GET /exam/light/show/by/student/{studentId}?days=365`.
- Statystyki: `GET /student/{studentId}/statistics?category=B&days=365`.

## Ważne ograniczenia i uwagi
- Format `PUT /exam`, pola obiektu i status HTTP 200 pochodzą z przechwyconego ruchu Proxyman.
- Próg zaliczenia kategorii B ustawiono roboczo na 68/74 punktów. Wymaga potwierdzenia w rzeczywistym teście na koncie; nie jest to pole zwracane przez API w pokazanym logu.
- Jednostka `timeOnQuestion` nie została ustalona; aplikacja obecnie przesyła 0.
- Nie znaleziono endpointu szczegółów egzaminu ani bezpośredniego URL zdjęć/filmów.
- Historia i statystyki wymagają aktywnego konta oraz dostępności upstream API.
- Sesje backendu są przechowywane w pamięci procesu. Restart serwera wyloguje użytkowników; przed publicznym wdrożeniem produkcyjnym należy dodać trwały magazyn sesji.
- Nie commituj pliku `.env`. Nie wpisuj tokenu API ręcznie do kodu.

## Zmienne środowiskowe
Skopiuj `.env.example` do `.env`. Nie wklejaj prawdziwych haseł ani tokenów do repozytorium.
