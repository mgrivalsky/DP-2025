# JWT Token Implementácia

## Popis
Bolo implementované JWT-based overovanie tokenov pre API routes `cas-slots` (časové sloty). Tokeny sa vytvárajú pri prihlásení a sú povinné pre prístup na chránené endpointy.

## Čo sa zmenilo

### Backend (`backend/`)

#### 1. **`.env` súbor**
- Pridaný `JWT_SECRET` - tajný kľúč pre podpisovanie tokenov
- Pridaný `DISABLE_AUTH` - nastavené na `false` (autentifikácia je aktívna)

```env
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
DISABLE_AUTH=false
```

#### 2. **`routes/auth.js`**
- Importovaný `jwt` modul
- Pri úspešnom prihlásení sa teraz vracia JWT token
- Token je valídny 24 hodín (`expiresIn: '24h'`)
- Token sa vracia v odpovedi ako `token` pole

```javascript
const token = jwt.sign(
  { id: u.id, email: u.email, role: u.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

#### 3. **`routes/casSlots.js`**
- Importovaný `authenticateToken` middleware
- Všetky routes v tomto súbore sú teraz chránené
- Vyžaduje `Authorization: Bearer <token>` header

```javascript
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);
```

#### 4. **`middleware/auth.js`**
- Middleware ostáva bez zmien (už bol implementovaný)
- Overuje token z `Authorization` headeru

### Frontend (`src/`)

#### 1. **`context/AuthContext.js`**
- Pridaný `token` stav
- Token sa ukladá do `localStorage` pri prihlásení
- Token sa posielaúa pri ľubovoľnom API requeste v Authorization headeru
- Pri `logout()` sa token vymazáva

#### 2. **`components/ReservationSystem.js`**
- Pridaná helper funcka `fetchWithToken()` na zaslanie requestu s tokenom
- Všetky requesty na `cas-slots` teraz používajú `fetchWithToken()`
- Token sa automaticky čita z `useAuth()` contextu

#### 3. **`components/AdminDashboard.jsx`**
- Pridaná helper funcka `fetchWithToken()`
- Všetky requesty na `cas-slots` sú upravené na používanie tokenu:
  - `loadSlots()` - načítanie zoznamu slotov
  - `addSlot()` - vytvorenie nového slotu
  - `performRemoveSlot()` - vymazanie slotu
  - `performTruncateSlots()` - vymazanie všetkých slotov

## Ako testovať

### 1. Bez tokenu (má vrátiť chybu 401)
```bash
curl -X GET http://localhost:5000/api/cas-slots
# Odpoveď: { "error": "Prístup odmietnutý - chýba token" }
```

### 2. S neplatným tokenom (má vrátiť chybu 403)
```bash
curl -X GET http://localhost:5000/api/cas-slots \
  -H "Authorization: Bearer invalid_token"
# Odpoveď: { "error": "Neplatný token" }
```

### 3. S platným tokenom
- Prihlásiť sa cez frontend
- Token sa automaticky uloží v `localStorage`
- Frontend automaticky pošle token pri wszystkich requestoch na `cas-slots`

## Testovacie účty

```
Psycholog: zuzova@spseke.sk / admin123
Učiteľ: ucitel@skolka.sk / user123
Študent: ziak@skolka.sk / user123
```

## Bezpečnosť

⚠️ **DÔLEŽITÉ**: Zmeniť `JWT_SECRET` v produkcii na bezpečný náhodný reťazec!

```bash
# Generovanie bezpečného hesla v Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Zmeny

### Login Endpoint
**POST** `/api/auth/login`

Odpoveď (úspešne):
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Meno Priezvisko",
    "role": "psycholog"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Protected Endpoint (cas-slots)
**GET** `/api/cas-slots`

Požiadavka:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Bez tokenu: `401 Unauthorized`
S neplatným tokenom: `403 Forbidden`

## Poznámky

- Frontend automaticky spravuje tokeny - nie je potrebné ručné managovanie
- Token je uložený v `localStorage` a je dostupný po obnove stránky
- Token vyprší po 24 hodinách
- Pri odhlásení sa token vymaže z `localStorage`
- Všetky ostatné API endpointy ostávajú bez zmien (ak si nie je potrebný token)
