# Bezpečnostné opatrenia – E‑psycholog

Tento dokument sumarizuje bezpečnostné opatrenia v projekte a odporúčania pred nasadením do produkcie.

> Poznámka: Toto nie je formálny audit ani právne/compliance posúdenie. Je to praktický checklist a prehľad technických opatrení.

## 1) Aktuálne implementované opatrenia (stav v kóde)

### Produkčné env premenné (minimum, aby bezpečnostné prvky fungovali)
- `NODE_ENV=production` (zapne „prod režim“ pre viacero kontrol: session cookie `secure`, zákaz dev fallback secretu a pod.)
- `FRONTEND_URL` – jediná povolená origin pre CORS (Express aj Socket.IO); default v dev: `http://localhost:3000`
- `JWT_SECRET` – povinné pre overenie JWT (REST aj Socket.IO); bez toho REST vráti 500 a Socket.IO odmietne handshake
- `SESSION_SECRET` – povinné v produkcii (server inak nenaštartuje)
- DB:
  - preferované: `DATABASE_URL` (v produkcii sa zapne SSL)
  - alebo lokálne: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Google OAuth (ak má byť funkčný): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Voliteľné:
  - `ADMIN_EMAILS` – zoznam admin/psychológ emailov oddelený čiarkou (napr. `a@x.sk,b@y.sk`)
  - `RATE_LIMIT_OTHER`, `RATE_LIMIT_CHAT` – konkrétne limity (viď nižšie)
  - `INIT_DB_ON_BOOT=true` – inicializácia DB schémy pri štarte (odporúčané len v dev/CI; viď riziká)

### Autentifikácia a autorizácia
- **JWT autentifikácia** pre chránené endpointy (`Authorization: Bearer <token>`):
  - Middleware: `backend/middleware/auth.js`
  - Overuje sa podpis a povolený algoritmus (`HS256`).
  - Ak `JWT_SECRET` nie je nastavený, API vráti **500** (`JWT_SECRET nie je nastavený na serveri`).
- **Dev bypass autentifikácie** je možný len mimo produkcie:
  - `DISABLE_AUTH=true` sa ignoruje v produkcii (`NODE_ENV=production`).
  - V dev móde (keď je bypass aktívny) sa do `req.user` vloží minimálna identita (`{ id: 2, role: 'ucitel', ... }`).
- **Role-based prístup** v routach (psychológ/admin vs. užívateľ):
  - Typicky pattern `isPsycholog(...)` + kontrola `req.user.id` (napr. `backend/routes/chat.js`, `backend/routes/trustBox.js`, `backend/routes/reservations.js`, `backend/routes/reports.js`).
  - V praxi sa používajú roly:
    - `psycholog` (a ekvivalentne `admin`)
    - používateľské roly z DB: typicky `student` / `ucitel`

### OAuth login (Google)
- Google OAuth cez `passport-google-oauth20`:
  - `backend/auth/passport.js`
  - Callback: `backend/routes/auth.js`
- OAuth je „best-effort“ inicializovaný:
  - ak chýbajú env premenné, server sa stále spustí, ale endpointy OAuth budú vracať chybu, kým sa nedokonfiguruje
- Povinné env pre OAuth:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Rozlíšenie psychológ vs. bežný používateľ:
  - `ADMIN_EMAILS` (comma-separated) určuje, ktoré emaily sa berú ako psychológ/admin
  - ak email nie je v `ADMIN_EMAILS`, používateľská rola sa určuje podľa emailu (`@spseke.sk` → `ucitel`, inak `student`) a/alebo sa uloží do DB
- **Token transport cez URL fragment** (nie query string):
  - Backend redirect: `/oauth-callback#token=...`
  - JWT sa podpisuje s `expiresIn: '1h'`
  - Frontend callback token spracuje a **okamžite vyčistí URL** (aby token nezostal v adrese/histórii):
    - `src/components/auth/OAuthCallback.jsx`

### Bezpečnostné hlavičky a rate limiting (API hardening)
- `helmet` pre bezpečnostné HTTP hlavičky:
  - Nastavené v `backend/server.js` (API-friendly konfigurácia).
  - Konkrétne je vypnuté:
    - `contentSecurityPolicy` (CSP)
    - `crossOriginEmbedderPolicy`
    - `crossOriginResourcePolicy`
- `express-rate-limit`:
  - Jeden spoločný limiter pre všetky **ne-chat** API endpointy + samostatný vyšší limiter pre **`/api/chat`**.
  - Konfigurovateľné cez env:
    - `RATE_LIMIT_OTHER` (default **400** / 15 min)
    - `RATE_LIMIT_CHAT` (default **800** / 15 min v produkcii; v dev default **1400** / 15 min)
  - Presná logika v `backend/server.js`:
    - `otherLimiter` je pripojený globálne (`app.use(otherLimiter)`), ale **skipuje**:
      - `/socket.io/*`
      - `/api/chat` a `/api/chat/*` (aby sa chat nelimitoval dvakrát)
    - `chatLimiter` je pripojený len na `/api/chat` (`app.use('/api/chat', chatLimiter)`) a **skipuje** `/socket.io/*`
  - Socket.IO (`/socket.io/*`) je z limitovania vynechané (limiter), ale je chránené JWT handshake-om.
- `trust proxy` zapnuté (Render/reverse proxy):
  - `app.set('trust proxy', 1)` v `backend/server.js`.
  - Poznámka: rate-limit je per-IP (`req.ip`). Pri viacerých používateľoch za jedným NAT/proxy sa limity zdieľajú.

### CORS (API aj Socket.IO)
- CORS je povolené len pre jednu origin:
  - `FRONTEND_URL` (default `http://localhost:3000`)
- `credentials: true` je zapnuté pre Express aj Socket.IO.

### Socket.IO (real-time) autentifikácia
- Socket.IO server je v `backend/server.js` a používa CORS rovnaký ako API.
- Autentifikácia prebieha cez JWT v handshake:
  - klient posiela `socket.handshake.auth.token`
  - bez tokenu → `missing_token`
  - bez `JWT_SECRET` → `missing_jwt_secret`
  - neplatný token → `invalid_token`
- Po pripojení server zaraďuje klienta do room-ov podľa roly:
  - `role:user` alebo `role:psycholog`
  - a zároveň `user:{id}` alebo `psycholog:{id}` (pre cielené notifikácie)

### Session (OAuth handshake)
- Session sa používa pre OAuth redirect handshake.
- `SESSION_SECRET` je v produkcii **povinný** (hard-fail bez nastavenia); v dev režime existuje len dev-only fallback s varovaním.
- Cookie nastavenia v `backend/server.js`:
  - `httpOnly: true`
  - `sameSite: 'lax'`
  - `secure: true` iba v produkcii (`NODE_ENV=production`)
- Poznámka: používa sa default session store (MemoryStore). Pre produkciu/multi-instance nasadenie je vhodné použiť externý store (Redis a pod.).

### DB pripojenie a základná hygiena
- **Parameterizované SQL** (nižšie riziko SQL injection) cez `pg`.
- DB config preferuje `DATABASE_URL` a v produkcii zapína SSL:
  - `backend/database/db.js`
  - Konkrétne: pri `DATABASE_URL` a `NODE_ENV=production` sa zapne `ssl: { rejectUnauthorized: false }`.

### Inicializácia DB schémy pri štarte (voliteľné)
- Ak je `INIT_DB_ON_BOOT=true`, server pri štarte:
  - načíta a spustí `backend/database/schema.sql`
  - vloží „default“ psychológa s `id_psychologa = 1` (ak neexistuje), aby sedeli frontend predpoklady
- V produkcii to nech je spravidla vypnuté (riziko nechcených zmien v DB pri reštarte).

### Logovanie citlivých dát
**Stav (prakticky):** v backend kóde sa nenachádza logovanie `req.body` ani priame vypisovanie textových polí (napr. `obsah`, `obsah_prispevku`, `poznamka`, `odpoved`).

**Poznámka:** globálny error handler v `backend/server.js` loguje `err.stack`. V produkcii je vhodné zvážiť centralizované logovanie s redakciou (masking) a bez stacktrace pre bežné chyby.

## 2) Kritické riziká / veci na dopracovanie pred produkciou

### 2.1 Token v localStorage (XSS riziko)
- Frontend ukladá JWT do `localStorage`:
  - `src/context/AuthContext.js`
- Ak by sa v UI objavil XSS (napr. nejaký neescapovaný obsah), útočník vie token z localStorage prečítať a použiť.

**Odporúčanie (vyššia bezpečnosť):** prejsť na **`httpOnly` cookie** session (alebo cookie s JWT), aby JS nevedel token vyčítať.

### 2.2 CSRF pri cookie-based auth
- Ak prejdeš na cookie auth, musíš riešiť **CSRF** (lebo prehliadač posiela cookie automaticky).

**Odporúčanie:** minimálne `SameSite=Lax` (ak to dovolí cross-site setup) + kontrola `Origin/Referer` pre `POST/PATCH/DELETE`, prípadne CSRF token.

### 2.3 CORS a domény
- `cors({ origin: FRONTEND_URL, credentials: true })` je OK pattern, ale treba ustriehnuť:
  - `FRONTEND_URL` je presne jedna dôveryhodná origin
  - v produkcii nepovoliť `*`


### 2.5 Session store v produkcii
- `express-session` bez explicitného store používa MemoryStore, ktorý nie je vhodný pre produkciu (multi-instance, reštarty, pamäť).

**Odporúčanie:** použiť perzistentný store (napr. Redis), nastaviť vhodné TTL a zvážiť prísnejšie `sameSite` podľa nasadenia.


## 3) Ochrana citlivého obsahu (odporúčané pre školského psychológa)

### 3.1 Stĺpcové šifrovanie (aplikačné šifrovanie)
Najvyšší prínos má šifrovať:
- `Sprava.obsah`
- `Schranka_dovery.obsah_prispevku` (a odporúčane aj `Schranka_dovery.odpoved`)
- `Rezervacia_sedeni.poznamka`

**Poznámka k schéme:** ciphertext bude spravidla dlhší než plaintext, takže je praktické mať tieto polia ako `TEXT`.

