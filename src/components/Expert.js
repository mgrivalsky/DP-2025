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

export default function Expert() {
  const [currentId, setCurrentId] = useState("root");
  const [history, setHistory] = useState([]);
  const node = useMemo(() => FLOW[currentId], [currentId]);

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
  };

  return (
    <section id="expert" className="expert-system" style={{ 
      padding: "60px 20px", 
      background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecf1 100%)",
      minHeight: "100vh"
    }}>
      <div className="container" style={{ maxWidth: "700px" }}>
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h2 style={{ fontSize: "2.8em", color: "#2c3e50", fontWeight: "700", marginBottom: "10px" }}>
            🧭 Tvoj Expertný Poradca
          </h2>
          <p style={{ fontSize: "1.1em", color: "#555", lineHeight: "1.6" }}>
            Postupuj krok za krokom a nájdi odpovede, ktoré potrebuješ
          </p>
        </div>

        <div style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          overflow: "hidden",
          animation: "slideUp 0.5s ease-out"
        }}>
          {/* Header s progress indikátorom */}
          <div style={{
            background: "linear-gradient(135deg, #5e72e4 0%, #3d5fd3 100%)",
            padding: "30px",
            color: "white",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "1.2em", opacity: 0.9, marginBottom: "10px", color: "white", fontWeight: "600" }}>
              {history.length > 0 && `Krok ${history.length + 1}`}
              {history.length === 0 && "Úvod"}
            </div>
            <h3 style={{ fontSize: "1.8em", margin: "0", fontWeight: "600", color: "white" }}>
              {node.title}
            </h3>
          </div>

          <div style={{ padding: "40px 30px" }}>
            <p style={{ 
              fontSize: "1.1em", 
              color: "#555", 
              lineHeight: "1.8",
              marginBottom: "30px",
              textAlign: "center"
            }}>
              {node.text}
            </p>

            {node.type === "question" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {node.options.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={() => goNext(opt.next)}
                    className="expert-option-btn"
                    style={{
                      padding: "16px 20px",
                      fontSize: "1em",
                      border: "2px solid #5e72e4",
                      borderRadius: "12px",
                      background: "white",
                      cursor: "pointer",
                      color: "#2c3e50",
                      fontWeight: "500",
                      transition: "all 0.3s ease",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ display: "block", marginBottom: "4px" }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {node.type === "result" && (
              <div style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #f1f3f8 100%)",
                padding: "30px",
                borderRadius: "16px",
                border: "2px solid #e9ecf1"
              }}>
                <h4 style={{ 
                  fontSize: "1.5em", 
                  color: "#2c3e50", 
                  marginBottom: "20px",
                  fontWeight: "600"
                }}>
                  💡 {node.title}
                </h4>
                <ul style={{ 
                  listStyle: "none", 
                  padding: "0",
                  margin: "0 0 25px 0"
                }}>
                  {node.recommendations.map((r, i) => (
                    <li key={i} style={{
                      padding: "12px 0 12px 30px",
                      position: "relative",
                      lineHeight: "1.6",
                      color: "#555",
                      fontSize: "1em",
                      borderBottom: i < node.recommendations.length - 1 ? "1px solid #dae3ef" : "none"
                    }}>
                      <span style={{
                        position: "absolute",
                        left: "0",
                        color: "#5e72e4",
                        fontWeight: "bold"
                      }}>✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
                <div style={{
                  background: "white",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "2px solid #fff3cd",
                  marginTop: "25px"
                }}>
                  <p style={{ 
                    margin: "0",
                    fontSize: "0.95em",
                    lineHeight: "1.7",
                    color: "#333"
                  }}>
                    <span style={{ fontSize: "1.3em", marginRight: "10px" }}>⚠️</span>
                    <strong>Ak sa cítiš v ohrození, volaj:</strong> <br/>
                    <span style={{ color: "#dc3545", fontWeight: "bold", fontSize: "1.1em" }}>112</span> (Záchranná linka) | 
                    <span style={{ color: "#5e72e4", fontWeight: "bold", marginLeft: "10px" }}>0800 800 566</span> (Linka Nezábudka)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer s tlačidlami */}
          <div style={{
            display: "flex",
            gap: "12px",
            padding: "20px 30px",
            borderTop: "1px solid #e9ecf1",
            justifyContent: "flex-end"
          }}>
            <button 
              onClick={goBack}
              disabled={history.length === 0}
              style={{
                padding: "12px 24px",
                fontSize: "0.95em",
                border: "2px solid #e0e6f0",
                borderRadius: "10px",
                background: "white",
                cursor: history.length === 0 ? "not-allowed" : "pointer",
                color: history.length === 0 ? "#ccc" : "#2c3e50",
                fontWeight: "500",
                transition: "all 0.3s ease",
                opacity: history.length === 0 ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (history.length > 0) {
                  e.target.style.background = "#f0f3ff";
                  e.target.style.borderColor = "#5e72e4";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "white";
                e.target.style.borderColor = "#e0e6f0";
              }}
            >
              ← Späť
            </button>
            <button 
              onClick={reset}
              style={{
                padding: "12px 24px",
                fontSize: "0.95em",
                border: "none",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #5e72e4 0%, #3d5fd3 100%)",
                color: "white",
                cursor: "pointer",
                fontWeight: "500",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(94, 114, 228, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              🔄 Začať odznova
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .expert-system {
          font-family: inherit;
        }

        .expert-option-btn {
          transition: all 0.3s ease !important;
        }

        .expert-option-btn:hover {
          border-color: #3d5fd3 !important;
          background: linear-gradient(135deg, #5e72e4 0%, #3d5fd3 100%) !important;
          color: white !important;
          transform: translateX(8px) !important;
          box-shadow: 0 4px 12px rgba(94, 114, 228, 0.3) !important;
        }

        .expert-option-btn:active {
          transform: translateX(6px) !important;
        }
      `}</style>
    </section>
  );
}