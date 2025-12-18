-- E-psycholog Database Schema

-- Tabuľka Užívateľov
CREATE TABLE IF NOT EXISTS Uzivatel (
    id_uzivatela SERIAL PRIMARY KEY,
    meno VARCHAR(100) NOT NULL,
    priezvisko VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    heslo VARCHAR(255) NOT NULL,
    typ_uzivatela VARCHAR(50) NOT NULL CHECK (typ_uzivatela IN ('student', 'ucitel', 'admin')),
    aktualny BOOLEAN DEFAULT true
);

-- Tabuľka Psychológov
CREATE TABLE IF NOT EXISTS Psychologicka (
    id_psychologicky SERIAL PRIMARY KEY,
    meno VARCHAR(100) NOT NULL,
    priezvisko VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    heslo VARCHAR(255) NOT NULL,
    telefon VARCHAR(20),
    je_online BOOLEAN DEFAULT false,
    aktualny BOOLEAN DEFAULT true
);

-- Tabuľka Schránky dôvery
CREATE TABLE IF NOT EXISTS Schranka_dovery (
    id_prispevku SERIAL PRIMARY KEY,
    kategoria VARCHAR(100) NOT NULL,
    obsah_prispevku VARCHAR(1000) NOT NULL,
    anonymne BOOLEAN DEFAULT false,
    publikovatelne BOOLEAN DEFAULT false,
    odpoved VARCHAR(1000),
    id_psychologicky INT REFERENCES Psychologicka(id_psychologicky) ON DELETE SET NULL,
    id_uzivatela INT NOT NULL REFERENCES Uzivatel(id_uzivatela) ON DELETE CASCADE,
    stav VARCHAR(50) DEFAULT 'novy' CHECK (stav IN ('novy', 'priradzene', 'vyriesene'))
);

-- Tabuľka Novinek
CREATE TABLE IF NOT EXISTS Novinky (
    id_novinky SERIAL PRIMARY KEY,
    nadpis VARCHAR(200) NOT NULL,
    popis VARCHAR(2000) NOT NULL,
    obsah TEXT,
    id_psychologicky INT NOT NULL REFERENCES Psychologicka(id_psychologicky) ON DELETE CASCADE,
    publikovane BOOLEAN DEFAULT false
);

-- Tabuľka Chatovania
CREATE TABLE IF NOT EXISTS Chat (
    id_chatu SERIAL PRIMARY KEY,
    id_uzivatela INT NOT NULL REFERENCES Uzivatel(id_uzivatela) ON DELETE CASCADE,
    id_psychologicky INT NOT NULL REFERENCES Psychologicka(id_psychologicky) ON DELETE CASCADE,
    zaciatok_chatu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    posledna_zprava TIMESTAMP,
    aktivny BOOLEAN DEFAULT true
);

-- Tabuľka Správ
CREATE TABLE IF NOT EXISTS Sprava (
    id_spravy SERIAL PRIMARY KEY,
    obsah VARCHAR(1000) NOT NULL,
    cas_odoslania TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    videne BOOLEAN DEFAULT false,
    id_chatu INT NOT NULL REFERENCES Chat(id_chatu) ON DELETE CASCADE,
    odesilatel_typ VARCHAR(20) NOT NULL CHECK (odesilatel_typ IN ('uzivatel', 'psycholog'))
);

-- Tabuľka Rezervácií sedení
CREATE TABLE IF NOT EXISTS Rezervacia_sedeni (
    id_sedenia SERIAL PRIMARY KEY,
    datum DATE NOT NULL,
    cas_od TIME NOT NULL,
    cas_do TIME NOT NULL,
    stav VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (stav IN ('pending', 'potvrdena', 'zrusena', 'dokoncena')),
    poznamka VARCHAR(500),
    id_psychologicky INT NOT NULL REFERENCES Psychologicka(id_psychologicky) ON DELETE RESTRICT,
    id_uzivatela INT NOT NULL REFERENCES Uzivatel(id_uzivatela) ON DELETE CASCADE,
    UNIQUE(datum, cas_od, id_psychologicky)
);

-- Tabuľka časových slotov (pre psychológa)
CREATE TABLE IF NOT EXISTS Cas_slot (
    id_casu SERIAL PRIMARY KEY,
    id_psychologicky INT NOT NULL REFERENCES Psychologicka(id_psychologicky) ON DELETE CASCADE,
    datum DATE NOT NULL,
    cas_od TIME NOT NULL,
    cas_do TIME NOT NULL,
    volny BOOLEAN DEFAULT true
);

-- INSERT testovacích dát
-- Psychológovia
INSERT INTO Psychologicka (meno, priezvisko, email, heslo, telefon, je_online) 
VALUES ('Mária', 'Nováková', 'psycholog@skolka.sk', 'admin123', '+421 2 1234 5678', false)
ON CONFLICT (email) DO NOTHING;

-- Užívatelia
INSERT INTO Uzivatel (meno, priezvisko, email, heslo, typ_uzivatela)
VALUES 
    ('Ján', 'Kovač', 'ucitel@skolka.sk', 'user123', 'ucitel'),
    ('Peter', 'Malý', 'ziak@skolka.sk', 'user123', 'student'),
    ('Mária', 'Veselá', 'ziacka@skolka.sk', 'user123', 'student'),
    ('Lucia', 'Horváthová', 'ucitelka@skolka.sk', 'user123', 'ucitel'),
    ('Tomáš', 'Benko', 'student2@skolka.sk', 'user123', 'student')
ON CONFLICT (email) DO NOTHING;

