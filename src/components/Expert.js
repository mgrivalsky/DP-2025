import React, { useEffect, useMemo, useState } from "react";

/**
 * Expertný systém (chatbot) pre študentov.
 *  - 3 možnosti na krok
 *  - vetvenie otázok
 *  - finálne odporúčania a bezpečnostné tipy
 */

const FLOW = {
  // ====== Krok 1
  root: {
    type: "question",
    title: "Ahoj, som tvoj sprievodca. Začnime:",
    text: "Čo ťa trápi najviac práve teraz?",
    options: [
      { label: "Študijný stres a termíny", next: "study" },
      { label: "Vzťahy / šikana / konflikty", next: "relations" },
      { label: "Psychická nepohoda (úzkosť, smútok, vyčerpanie)", next: "mood" },
    ],
  },

  // ====== Vetva: Štúdium
  study: {
    type: "question",
    title: "Študijný stres",
    text: "Kde to cítiš najviac?",
    options: [
      { label: "Nestíham učenie, veľa predmetov", next: "study_time" },
      { label: "Obavy zo skúšok / prezentácií", next: "study_exam" },
      { label: "Prokrastinácia a motivácia", next: "study_procrast" },
    ],
  },
  study_time: {
    type: "question",
    title: "Riadenie času",
    text: "Čo by ti teraz najviac pomohlo?",
    options: [
      { label: "Základný plán na týždeň", next: "res_study_plan" },
      { label: "Techniky učenia (Pomodoro, aktívne učenie)", next: "res_study_tech" },
      { label: "Komunikácia s vyučujúcim o termíne", next: "res_study_talk" },
    ],
  },
  study_exam: {
    type: "question",
    title: "Obavy zo skúšok",
    text: "Čo je najväčší stresor?",
    options: [
      { label: "Tréma a fyzická nervozita", next: "res_exam_anxiety" },
      { label: "Neviem, čo bude na skúške", next: "res_exam_scope" },
      { label: "Strach z neúspechu", next: "res_exam_failure" },
    ],
  },
  study_procrast: {
    type: "question",
    title: "Prokrastinácia",
    text: "Čo ti najviac bráni začať?",
    options: [
      { label: "Dokonalosť / „musí to byť tip-top“", next: "res_proc_perfect" },
      { label: "Neviem, kde začať", next: "res_proc_start" },
      { label: "Som vyčerpaný/á", next: "res_proc_energy" },
    ],
  },

  // ====== Vetva: Vzťahy / šikana
  relations: {
    type: "question",
    title: "Vzťahy a bezpečie",
    text: "Ktorá oblasť je ti najbližšia?",
    options: [
      { label: "Šikana / online útoky", next: "rel_bullying" },
      { label: "Konflikty s rovesníkmi", next: "rel_conflict" },
      { label: "Problémy v rodine", next: "rel_family" },
    ],
  },
  rel_bullying: {
    type: "question",
    title: "Šikana",
    text: "Ako sa to deje najčastejšie?",
    options: [
      { label: "V škole / na chodbe / v skupine", next: "res_bully_school" },
      { label: "Online (sociálne siete, správy)", next: "res_bully_online" },
      { label: "Mám strach o svoju bezpečnosť", next: "res_bully_safety" },
    ],
  },
  rel_conflict: {
    type: "question",
    title: "Konflikty",
    text: "Čo by si chcel/a skúsiť ako prvé?",
    options: [
      { label: "Bezpečný rozhovor (model 3 krokov)", next: "res_conf_talk" },
      { label: "Zapojenie mediátora / triedneho", next: "res_conf_mediator" },
      { label: "Práca s hnevom a emóciami", next: "res_conf_emotions" },
    ],
  },
  rel_family: {
    type: "question",
    title: "Rodina",
    text: "Čo ťa trápi v rodine najviac?",
    options: [
      { label: "Časté hádky / napätie", next: "res_family_talk" },
      { label: "Nepochopenie / málo podpory", next: "res_family_support" },
      { label: "Financie / vážne problémy doma", next: "res_family_crisis" },
    ],
  },

  // ====== Vetva: Nálada / psychická nepohoda
  mood: {
    type: "question",
    title: "Psychická nepohoda",
    text: "Ako by si to opísal/a?",
    options: [
      { label: "Úzkosť / napätie", next: "mood_anx" },
      { label: "Smútok / prázdno", next: "mood_low" },
      { label: "Vyčerpanie / vyhorenie", next: "mood_burnout" },
    ],
  },
  mood_anx: {
    type: "question",
    title: "Úzkosť",
    text: "Kedy to prichádza najviac?",
    options: [
      { label: "Pred školou / na prednáškach", next: "res_anx_school" },
      { label: "Večer / v noci", next: "res_anx_evening" },
      { label: "Kedykoľvek (ťažké dýchanie, bušenie srdca)", next: "res_anx_panic" },
    ],
  },
  mood_low: {
    type: "question",
    title: "Nálada dole",
    text: "Čo cítiš najčastejšie?",
    options: [
      { label: "Strata záujmu / motivácie", next: "res_low_motivation" },
      { label: "Smutok a osamelosť", next: "res_low_lonely" },
      { label: "Myšlienky na ublíženie si", next: "res_low_crisis" },
    ],
  },
  mood_burnout: {
    type: "question",
    title: "Vyčerpanie",
    text: "Čo by ti pomohlo ako prvé?",
    options: [
      { label: "Mikro oddych (minipauzy, dýchanie)", next: "res_bo_micro" },
      { label: "Režim dňa a spánok", next: "res_bo_sleep" },
      { label: "Znížiť preťaženie / priority", next: "res_bo_priorities" },
    ],
  },

  // ====== Finálne odporúčania (results)
  res_study_plan: {
    type: "result",
    title: "Týždenný miniplán",
    recommendations: [
      "Napíš si 3–5 priorít na týždeň (max. 2 ťažké/deň).",
      "Použi 45–15 min bloky (alebo 25–5 Pomodoro).",
      "Začni 10-min štartom: len otvor skriptá a urob prvý krok.",
    ],
  },
  res_study_tech: {
    type: "result",
    title: "Techniky učenia",
    recommendations: [
      "Aktívne učenie: otázky + vlastnými slovami.",
      "Striedaj predmety (kontrast) a skúšaj sa testovať.",
      "Záver bloku = krátke zhrnutie na 3 vety.",
    ],
  },
  res_study_talk: {
    type: "result",
    title: "Komunikácia s vyučujúcim",
    recommendations: [
      "Krátky e-mail: čo stíhaš, čo potrebuješ posunúť, návrh termínu.",
      "Buď vecný/á, uveď dôvod a navrhni riešenie.",
      "Pošli čím skôr – často sa dá nájsť kompromis.",
    ],
  },
  res_exam_anxiety: {
    type: "result",
    title: "Tréma pred skúškou",
    recommendations: [
      "Dýchanie 4-4-6 (nádych 4, podrž 4, výdych 6 – 2 min).",
      "Generálka: precvič si nahlas 1–2 otázky.",
      "Pred vstupom: uvoľni ramená, pomalý krok, pomalá reč.",
    ],
  },
  res_exam_scope: {
    type: "result",
    title: "Neistota v obsahu",
    recommendations: [
      "Pozbieraj sylaby, otázky z minulých rokov, poznámky spolužiakov.",
      "Vytvor si checklist tém, ktoré si potrebuješ prejsť.",
      "Ak niečo chýba, napíš vyučujúcemu 2–3 vecné otázky.",
    ],
  },
  res_exam_failure: {
    type: "result",
    title: "Strach z neúspechu",
    recommendations: [
      "Napíš si: Čo je najhoršie? Čo urobím v takom prípade? (plán B).",
      "Pripomeň si predošlé úspechy (3 konkrétne situácie).",
      "Zameraj sa na proces, nie výsledok – malé kroky sa rátajú.",
    ],
  },
  res_proc_perfect: {
    type: "result",
    title: "Perfekcionizmus",
    recommendations: [
      "Stanov „dostatočne dobré“ kritérium (napr. 80 %).",
      "Nastav časový limit (napr. 90 min a odoslať verziu 1).",
      "Začni najjednoduchšou časťou – spustí to pohyb.",
    ],
  },
  res_proc_start: {
    type: "result",
    title: "Neviem, kde začať",
    recommendations: [
      "Napíš si 3 min zoznam konkrétnych mini-krokov.",
      "Vyber 1 krok, nastav 10 min časovač a len začni.",
      "Po 10 min vyhodnoť: Pokračujem / dám pauzu / zmením krok.",
    ],
  },
  res_proc_energy: {
    type: "result",
    title: "Nízka energia",
    recommendations: [
      "Skús 3× hlboký nádych, pohyb (krátka prechádzka).",
      "Voda + malé jedlo; vyhni sa prejedaniu/kofeínu neskoro.",
      "Ak dlhodobo vyčerpaný/á, skús upraviť spánkový režim.",
    ],
  },

  res_bully_school: {
    type: "result",
    title: "Šikana v škole",
    recommendations: [
      "Zaznamenávaj incidenty (kto, kedy, kde, svedkovia).",
      "Oslov triedneho, metodika prevencie alebo dôveryhodného učiteľa.",
      "Chráň si bezpečie – pohybuj sa s kamarátmi, vyhni sa rizikovým miestam.",
    ],
  },
  res_bully_online: {
    type: "result",
    title: "Kyberšikana",
    recommendations: [
      "Urob screenshoty a ulož dôkazy.",
      "Blokuj a nahlás útočníkov, nastav súkromie profilov.",
      "Povedz o tom dospelej osobe v škole alebo doma.",
    ],
  },
  res_bully_safety: {
    type: "result",
    title: "Bezprostredná bezpečnosť",
    recommendations: [
      "Ak si v ohrození, volaj 112 (okamžitá pomoc).",
      "Požiadaj spolužiaka/dospelého, aby išiel s tebou.",
      "Nezostávaj sám/sama na rizikových miestach.",
    ],
  },

  res_conf_talk: {
    type: "result",
    title: "Bezpečný rozhovor (3 kroky)",
    recommendations: [
      "Popíš situáciu bez obviňovania („Keď sa stalo X…“).",
      "Povedz, ako sa cítiš („Cítil/a som sa…“).",
      "Navrhni riešenie („Skúsme dohodu: …“).",
    ],
  },
  res_conf_mediator: {
    type: "result",
    title: "Zapoj mediátora",
    recommendations: [
      "Požiadaj triedneho/školského koordinátora o sprostredkovanie.",
      "Dohodni pravidlá rozhovoru (čas, rešpekt, slovo na striedačku).",
      "Cieľ: dohoda o konkrétnych krokoch pre obe strany.",
    ],
  },
  res_conf_emotions: {
    type: "result",
    title: "Práca s emóciami",
    recommendations: [
      "Nauč sa pauzu: STOP (zastav sa – nadýchni – pozoruj – pokračuj).",
      "Vypíš si myšlienky 5 min – zníži to tlak v hlave.",
      "Bezpečný ventil: pohyb, hudba, kreatívna činnosť.",
    ],
  },

  res_family_talk: {
    type: "result",
    title: "Rozhovor v rodine",
    recommendations: [
      "Vyber vhodný čas bez rušenia (max. 20–30 min).",
      "Začni „ja-výrokmi“ a konkrétnou prosbou o pomoc.",
      "Dohodnite si prvý malý krok (napr. spoločný plán).",
    ],
  },
  res_family_support: {
    type: "result",
    title: "Hľadanie podpory",
    recommendations: [
      "Identifikuj 1–2 osoby, ktoré sú ti blízko (spolužiak, učiteľ).",
      "Povedz im konkrétne, s čím potrebuješ pomoc.",
      "Skús študentské poradenské centrum na škole.",
    ],
  },
  res_family_crisis: {
    type: "result",
    title: "Vážne problémy doma",
    recommendations: [
      "Ak je to nebezpečné: 112.",
      "Hľadaj bezpečný priestor u blízkej osoby.",
      "Kontaktuj dôveryhodného dospelého (učiteľ, výchovný poradca).",
    ],
  },

  res_anx_school: {
    type: "result",
    title: "Úzkosť v škole",
    recommendations: [
      "Pred vstupom: 2 min dýchania + uvoľnenie ramien.",
      "Malé ciele na vyučovaní (1 otázka, 1 poznámka).",
      "Po hodine krátke ocenenie (čo sa podarilo).",
    ],
  },
  res_anx_evening: {
    type: "result",
    title: "Úzkosť večer",
    recommendations: [
      "Vylož to z hlavy na papier (to-do na zajtra).",
      "Hygiena spánku: menej obrazoviek 60 min pred spaním.",
      "Dýchacie cvičenie / vedená relaxácia.",
    ],
  },
  res_anx_panic: {
    type: "result",
    title: "Panika / ataky",
    recommendations: [
      "Zameraj sa na dýchanie + 5 vecí (vidím, počujem, cítim…).",
      "Sadni si, oprite nohy, uzemnenie telom.",
      "Po ataku oddych a pohár vody.",
    ],
  },

  res_low_motivation: {
    type: "result",
    title: "Strata motivácie",
    recommendations: [
      "Nastav mini-cieľ na 10–15 min a odmeň sa drobnosťou.",
      "Spájaj učenie s miestom a časom (rituál).",
      "Pridaj sociálny záväzok (učiť sa s niekým).",
    ],
  },
  res_low_lonely: {
    type: "result",
    title: "Smutok a osamelosť",
    recommendations: [
      "Napíš 1 osobe správu/pozvánku na krátke stretnutie.",
      "Krátky pohyb vonku (aspoň 10 min).",
      "Zváž skupinové aktivity/predmety, kde sú noví ľudia.",
    ],
  },
  res_low_crisis: {
    type: "result",
    title: "Dôležité – bezpečnosť",
    recommendations: [
      "Ak máš myšlienky ublížiť si alebo si v ohrození, volaj 112.",
      "Linka dôvery Nezábudka: 0800 800 566 (nonstop).",
      "Linka pre deti a mládež: 116 111, IPčko.sk – nonstop chat.",
    ],
  },

  res_bo_micro: {
    type: "result",
    title: "Mikro oddych",
    recommendations: [
      "Každých 45 min krátka pauza (postav sa, napi sa vody).",
      "Krátke preťahovanie alebo 10 drepov.",
      "1–2 min dýchacie cvičenie.",
    ],
  },
  res_bo_sleep: {
    type: "result",
    title: "Spánok",
    recommendations: [
      "Približne rovnaký čas zaspávania/vstávania.",
      "Obmedz kofeín po 15:00, menej obrazoviek večer.",
      "Tlmené svetlo 60 min pred spaním.",
    ],
  },
  res_bo_priorities: {
    type: "result",
    title: "Priority a záťaž",
    recommendations: [
      "Napíš si všetko, čo máš – vyber 3 najdôležitejšie.",
      "Čo môže počkať / delegovať? Sprav realistický plán.",
      "Hľadaj podporu – spolužiak, učiteľ, rodina.",
    ],
  },
};

const STORAGE_KEY = "expert_state_v2";

export default function Expert() {
  const [currentId, setCurrentId] = useState("root");
  const [history, setHistory] = useState([]);
  const node = useMemo(() => FLOW[currentId], [currentId]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.currentId && FLOW[parsed.currentId]) {
          setCurrentId(parsed.currentId);
          setHistory(parsed.history || []);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentId, history }));
  }, [currentId, history]);

  const goNext = (nextId) => {
    setHistory((h) => [...h, currentId]);
    setCurrentId(nextId);
  };

  const goBack = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = [...h];
      const last = prev.pop();
      setCurrentId(last);
      return prev;
    });
  };

  const reset = () => {
    setCurrentId("root");
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <section id="expert" className="expert-system">
      <div className="expert-box">
        <header className="expert-header">
          <div className="expert-status">
            <div className="status-dot"></div>
            <span>Virtuálny sprievodca</span>
          </div>
        </header>

        <div className="expert-body">
          <h3>{node.title}</h3>
          <p className="expert-text">{node.text}</p>

          {node.type === "question" && (
            <div className="expert-options">
              {node.options.map((opt, i) => (
                <button key={i} onClick={() => goNext(opt.next)}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {node.type === "result" && (
            <div className="expert-result">
              <h4>{node.title}</h4>
              <ul>
                {node.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <p className="expert-warning">
                Ak sa cítiš v ohrození, volaj <strong>112</strong> alebo kontaktuj{" "}
                <strong>Linku Nezábudka (0800 800 566)</strong>.
              </p>
            </div>
          )}
        </div>

        <footer className="expert-footer">
          <button onClick={reset}>Začať odznova</button>
          <button onClick={goBack} disabled={history.length === 0}>
            Späť
          </button>
        </footer>
      </div>
    </section>
  );
}