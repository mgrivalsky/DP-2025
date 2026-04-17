-- E-psycholog Database Schema

-- Tabuľka Užívateľov
CREATE TABLE IF NOT EXISTS Uzivatel (
    id_uzivatela SERIAL PRIMARY KEY,
    meno VARCHAR(100) NOT NULL,
    priezvisko VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    typ_uzivatela VARCHAR(50) NOT NULL CHECK (typ_uzivatela IN ('student', 'ucitel'))
);

-- Tabuľka Psychológov
CREATE TABLE IF NOT EXISTS Psycholog (
    id_psychologa SERIAL PRIMARY KEY,
    meno VARCHAR(100) NOT NULL,
    priezvisko VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefon VARCHAR(20),
    je_online BOOLEAN DEFAULT false
);

-- Tabuľka Schránky dôvery
CREATE TABLE IF NOT EXISTS Schranka_dovery (
    id_prispevku SERIAL PRIMARY KEY,
    kategoria VARCHAR(100) NOT NULL,
    obsah_prispevku VARCHAR(1000) NOT NULL,
    anonymne BOOLEAN DEFAULT false,
    publikovatelne BOOLEAN DEFAULT false,
    zverejnene BOOLEAN DEFAULT false,
    videne_psychologom BOOLEAN NOT NULL DEFAULT false,
    videne_uzivatelom BOOLEAN NOT NULL DEFAULT true,
    odpoved VARCHAR(1000),
    datum_pridania TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_psychologa INT REFERENCES Psycholog(id_psychologa) ON DELETE SET NULL,
    id_uzivatela INT REFERENCES Uzivatel(id_uzivatela) ON DELETE CASCADE
);


-- Tabuľka Novinek
CREATE TABLE IF NOT EXISTS Novinky (
    id_novinky SERIAL PRIMARY KEY,
    nadpis VARCHAR(200) NOT NULL,
    popis VARCHAR(2000) NOT NULL,
    obsah TEXT,
    id_psychologa INT NOT NULL REFERENCES Psycholog(id_psychologa) ON DELETE CASCADE,
    publikovane BOOLEAN DEFAULT false
);

-- Tabuľka Chatovania
CREATE TABLE IF NOT EXISTS Chat (
    id_chatu SERIAL PRIMARY KEY,
    id_uzivatela INT NOT NULL REFERENCES Uzivatel(id_uzivatela) ON DELETE CASCADE,
    id_psychologa INT NOT NULL REFERENCES Psycholog(id_psychologa) ON DELETE CASCADE,
    zaciatok_chatu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    posledna_sprava TIMESTAMP,
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
    vytvorene TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stav VARCHAR(50) NOT NULL DEFAULT 'vytvorena' CHECK (stav IN ('vytvorena', 'potvrdena', 'zrusena', 'dokoncena')),
    poznamka VARCHAR(500),
    videne_psychologom BOOLEAN NOT NULL DEFAULT false,
    id_psychologa INT NOT NULL REFERENCES Psycholog(id_psychologa) ON DELETE RESTRICT,
    id_uzivatela INT NOT NULL REFERENCES Uzivatel(id_uzivatela) ON DELETE CASCADE,
    UNIQUE(datum, cas_od, id_psychologa)
);

-- Tabuľka časových slotov (pre psychológa)
CREATE TABLE IF NOT EXISTS Cas_slot (
    id_casu SERIAL PRIMARY KEY,
    id_psychologa INT NOT NULL REFERENCES Psycholog(id_psychologa) ON DELETE CASCADE,
    datum DATE NOT NULL,
    cas_od TIME NOT NULL,
    cas_do TIME NOT NULL,
    volny BOOLEAN DEFAULT true
);

-- Tabuľka logu použitia expertného systému (dokončenie kroku 4)
-- Slúži iba na anonymizovaný zber štatistík: ukladá sa čas dokončenia a typ problému.
CREATE TABLE IF NOT EXISTS expetny_system (
    id_dokoncenia SERIAL PRIMARY KEY,
    datum_cas TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    typ_problemu VARCHAR(255) NOT NULL
);




