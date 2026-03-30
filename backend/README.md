# E-psycholog Backend API

Backend pre rezervačný systém psychologických sedení.

## Požiadavky

- Node.js (v14 alebo vyššia)
- PostgreSQL (v12 alebo vyššia)

## Inštalácia

1. Prejdite do backend priečinka:
```bash
cd backend
```

2. Nainštalujte závislosti:
```bash
npm install
```

3. Nastavte PostgreSQL:

### Inštalácia PostgreSQL na Windows:
- Stiahnite PostgreSQL z https://www.postgresql.org/download/windows/
- Spustite inštalátor a postupujte podľa pokynov
- Zaznamenajte si heslo pre používateľa postgres
- Predvolený port je 5432

4. Vytvorte databázu:

Otvorte PostgreSQL príkazový riadok (psql) alebo pgAdmin a spustite:
```sql
CREATE DATABASE e_psycholog;
```

5. Naimportujte schému:
```bash
psql -U postgres -d e_psycholog -f database/schema.sql
```

Alebo v pgAdmin:
- Kliknite pravým tlačidlom na databázu e_psycholog
- Query Tool
- Otvorte súbor database/schema.sql
- Spustite (F5)

6. Nakonfigurujte .env súbor:
Upravte súbor `.env` a nastavte svoje databázové prihlasovacie údaje:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_psycholog
DB_USER=postgres
DB_PASSWORD=vase_heslo
JWT_SECRET=nahodny_tajny_kluc
```

7. Spustite server:

Development mode (automatický restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server bude bežať na `http://localhost:5000`

## API Endpointy

### Autentifikácia

Prihlásenie je realizované výhradne cez Google OAuth (bez interných hesiel).

#### GET /api/auth/google
Spustí Google OAuth flow.

#### GET /api/auth/google/callback
OAuth callback (musí sa zhodovať s `GOOGLE_CALLBACK_URL`).

#### GET /api/auth/me
Vráti profil aktuálne prihláseného používateľa na základe JWT v hlavičke `Authorization: Bearer <token>`.

#### POST /api/auth/logout
Odhlási používateľa na klientovi (token sa maže vo fronte) a ak ide o psychológa/admina, backend nastaví `je_online=false`.

### Rezervácie

Všetky endpointy vyžadujú Authorization header: `Bearer <token>`

#### GET /api/reservations/available-days
Získať dostupné dni pre rezervácie

#### GET /api/reservations/available-times/:date
Získať dostupné časy pre konkrétny dátum

#### GET /api/reservations/my-reservations
Získať všetky rezervácie prihlásený používateľa

#### GET /api/reservations/all
Získať všetky rezervácie (iba admin)

#### POST /api/reservations
Vytvoriť novú rezerváciu
```json
{
  "date": "2025-12-20",
  "time": "11:30",
  "notes": "Poznámka k rezervácii"
}
```

#### DELETE /api/reservations/:id
Zrušiť rezerváciu

#### PATCH /api/reservations/:id/status
Aktualizovať status rezervácie (iba admin)
```json
{
  "status": "confirmed"
}
```

## Testovacie účty

Aplikácia nepoužíva interné účty s heslom. Pri prvom prihlásení cez Google sa používateľ automaticky vytvorí v databáze podľa emailu.

## Štruktúra databázy

- **users** - Používatelia systému
- **time_slots** - Dostupné časové sloty
- **available_days** - Dostupné dni pre rezervácie
- **reservations** - Rezervácie sedení
