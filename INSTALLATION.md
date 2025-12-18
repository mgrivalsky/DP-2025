# Inštalácia a spustenie E-psycholog aplikácie

## 1. Inštalácia PostgreSQL

### Windows:
1. Stiahnite PostgreSQL z: https://www.postgresql.org/download/windows/
2. Spustite inštalátor a postupujte podľa pokynov
3. Zaznamenajte si heslo pre používateľa `postgres`
4. Nechajte predvolený port `5432`

## 2. Vytvorenie databázy

Otvorte PowerShell a spustite PostgreSQL príkazový riadok:
```powershell
& "C:\Program Files\PostgreSQL\<verzia>\bin\psql.exe" -U postgres
```

V psql konzole zadajte:
```sql
CREATE DATABASE e_psycholog;
\q
```

Alebo použite pgAdmin (grafické rozhranie):
- Spustite pgAdmin
- Pravý klik na Databases → Create → Database
- Zadajte názov: `e_psycholog`
- Kliknite Save

## 3. Import databázovej schémy

### Pomocou psql:
```powershell
cd C:\Users\mgriv\Desktop\DP\React-Landing-Page-Template\backend
& "C:\Program Files\PostgreSQL\<verzia>\bin\psql.exe" -U postgres -d e_psycholog -f database\schema.sql
```

### Pomocou pgAdmin:
1. Otvorte pgAdmin
2. Pripojte sa k serveru
3. Rozbaľte Databases → e_psycholog
4. Pravý klik na e_psycholog → Query Tool
5. Otvorte súbor `backend/database/schema.sql` (File → Open)
6. Spustite (F5 alebo tlačidlo Execute)

## 4. Nastavenie backendu

```powershell
cd C:\Users\mgriv\Desktop\DP\React-Landing-Page-Template\backend
```

Upravte súbor `.env` a nastavte svoje heslo k databáze:
```
DB_PASSWORD=vase_postgres_heslo
```

Nainštalujte závislosti:
```powershell
npm install
```

## 5. Spustenie backendu

Development mode (automatický restart pri zmenách):
```powershell
npm run dev
```

Alebo production mode:
```powershell
npm start
```

Backend bude bežať na: http://localhost:5000

## 6. Spustenie frontendu

Otvorte nové PowerShell okno:
```powershell
cd C:\Users\mgriv\Desktop\DP\React-Landing-Page-Template
npm start
```

Frontend bude bežať na: http://localhost:3000

## 7. Testovanie

Prihlasovacie údaje:
- **Psychológ (Admin)**: psycholog@skolka.sk / admin123
- **Učiteľ**: ucitel@skolka.sk / user123
- **Žiak**: ziak@skolka.sk / user123

## Riešenie problémov

### PostgreSQL sa nespustil:
```powershell
# Skontrolujte, či beží služba
Get-Service -Name postgresql*
```

### Chyba pripojenia k databáze:
- Overte, že PostgreSQL beží
- Skontrolujte heslo v `.env` súbore
- Overte, že databáza `e_psycholog` existuje

### Port už používaný:
Ak port 5000 alebo 3000 už používa iná aplikácia, zmeňte port v `.env` (backend) alebo v `package.json` (frontend)
