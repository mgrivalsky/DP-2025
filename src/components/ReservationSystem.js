import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useAuth } from "../context/AuthContext";
import "react-calendar/dist/Calendar.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

// Helper funkcií na zaslanie requestu s tokenom
const fetchWithToken = async (url, token, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('📤 Posielam request s tokenom:', url);
  } else {
    console.warn('⚠️ Žiadny token pri requeste na:', url);
  }
  return fetch(url, { ...options, headers });
};

const ReservationSystem = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, token } = useAuth();

  // Načítať všetky dostupné dni (dni s voľnými slotmi)
  useEffect(() => {
    if (!token) return; // Čaká sa na token
    const fetchAvailableDays = async () => {
      try {
        const resp = await fetchWithToken(`${API_BASE}/api/cas-slots?psycholog_id=1`, token);
        const data = await resp.json();
        console.log('Dostupné sloty z API:', data);
        if (resp.ok && data) {
          // Zobrať len voľné sloty a extrahovať unikátne dátumy
          const freeSlots = data.filter(s => s.volny);
          console.log('Voľné sloty:', freeSlots);
          // Dátum už je v YYYY-MM-DD formáte z API
          const freeDates = [...new Set(
            freeSlots.map(s => s.datum)
          )].map(dateStr => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
          });
          console.log('Dostupné dátumy:', freeDates);
          setAvailableDays(freeDates);
          if (freeDates.length === 0) {
            setMessage('ℹ️ Psychologička zatiaľ nepridala žiadne voľné termíny.');
          }
        }
      } catch (err) {
        console.error('Chyba pri načítaní dostupných dní:', err);
        setMessage('❌ Chyba pri načítaní dostupných termínov');
      }
    };
    fetchAvailableDays();
  }, [token]);

  // Načítanie slotov pre vybraný dátum
  useEffect(() => {
    if (!token) return; // Čaká sa na token
    const fetchSlots = async () => {
      if (!selectedDate) return;
      setLoadingSlots(true);
      setMessage("");
      // Použiť lokálny dátum namiesto UTC
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      console.log('🔍 Načítavam sloty pre dátum:', dateStr);
      try {
        const resp = await fetchWithToken(`${API_BASE}/api/cas-slots?psycholog_id=1&date=${dateStr}`, token);
        const data = await resp.json();
        console.log('✅ API odpoveď - sloty pre', dateStr, ':', data);
        if (!resp.ok) {
          setMessage(`❌ Nepodarilo sa načítať sloty: ${data?.error || "neznáma chyba"}`);
          setSlots([]);
        } else {
          const freeSlots = (data || []).filter((s) => s.volny !== false);
          console.log('✅ Voľné sloty pre zobrazenie:', freeSlots);
          setSlots(freeSlots);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Chyba pri načítaní slotov");
        setSlots([]);
      } finally {
        setLoadingSlots(false);
        setSelectedSlot(null);
      }
    };

    fetchSlots();
  }, [selectedDate, token]);

  const handleReserve = async () => {
    setMessage("");

    if (!user || !user.email) {
      setMessage("❌ Musíte byť prihlásený, chýba email užívateľa.");
      return;
    }

    if (!selectedDate || !selectedSlot) {
      setMessage("❌ Prosím vyber dátum aj čas.");
      return;
    }

    // Použiť lokálny dátum namiesto UTC
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const datum = `${year}-${month}-${day}`;
    const cas_od = selectedSlot.cas_od;
    const cas_do = selectedSlot.cas_do;

    try {
      setSubmitting(true);
      const resp = await fetchWithToken(`${API_BASE}/api/reservations`, token, {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          datum,
          cas_od,
          cas_do: cas_do,
          poznamka: "",
          stav: "pending",
          id_psychologicky: 1
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setMessage(`❌ Chyba: ${data?.error || "neznáma"}`);
      } else {
        setMessage("✅ Rezervácia úspešne vytvorená");
        // označ slot ako obsadený
        await fetchWithToken(`${API_BASE}/api/cas-slots/${selectedSlot.id_casu}`, token, {
          method: "PATCH",
          body: JSON.stringify({ volny: false })
        });
        setSlots((prev) => prev.filter((s) => s.id_casu !== selectedSlot.id_casu));
        setSelectedSlot(null);
      }
    } catch (err) {
      setMessage("❌ Chyba pri volaní API");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeClick = (slot) => {
    if (selectedSlot && selectedSlot.id_casu === slot.id_casu) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };

  const handleDateChange = (date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
      setSelectedSlot(null);
    } else {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  };

  const tileDisabled = ({ date, view }) => {
    if (view === "month") {
      return !availableDays.some((d) => isSameDay(d, date));
    }
    return false;
  };

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      if (availableDays.some((d) => isSameDay(d, date))) {
        return selectedDate && isSameDay(selectedDate, date)
          ? "selected-day"
          : "available-day";
      }
    }
    return null;
  };

  return (
    <section id="ReservationSystem" className="reservation-system">
      <h2>Rezervácia sedení</h2>
      
      {availableDays.length === 0 && (
        <div style={{
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          background: '#fff3cd',
          color: '#856404',
          textAlign: 'center'
        }}>
          ℹ️ Psychologička zatiaľ nepridala žiadne voľné termíny. Prosím skús to neskôr.
        </div>
      )}
      
      <div className="reservation-container">
        <div className="calendar">
          <h4>Vyberte si dátum</h4>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileDisabled={tileDisabled}
            tileClassName={tileClassName}
          />
        </div>

        <div className="divider" />

        <div className="times">
          <h4>Dostupné termíny:</h4>
          {selectedDate ? (
            <>
              {loadingSlots && <p>Načítavam sloty...</p>}
              {!loadingSlots && slots.length === 0 && (
                <p>Žiadne voľné sloty pre tento deň.</p>
              )}
              <div className="time-buttons">
                {slots.map((slot) => (
                  <button
                    key={slot.id_casu}
                    className={selectedSlot?.id_casu === slot.id_casu ? "selected" : ""}
                    onClick={() => handleTimeClick(slot)}
                  >
                    {slot.cas_od?.slice(0,5)} - {slot.cas_do?.slice(0,5)}
                  </button>
                ))}
              </div>
              <div className="selected-info">
                {selectedSlot
                  ? `Vybrané: ${selectedSlot.cas_od?.slice(0,5)} - ${selectedSlot.cas_do?.slice(0,5)} dňa ${selectedDate.toLocaleDateString()}`
                  : "Prosím vyber čas."}
              </div>
            </>
          ) : (
            <p>Najprv si vyber dátum v kalendári.</p>
          )}
        </div>
      </div>

      <button className="reserve-btn" onClick={handleReserve}>
        {submitting ? "Rezervujem..." : "Rezervovať"}
      </button>

      {message && (
        <div style={{
          marginTop: "12px",
          padding: "10px",
          borderRadius: "8px",
          background: message.startsWith("✅") ? "#d4edda" : "#f8d7da",
          color: message.startsWith("✅") ? "#155724" : "#721c24"
        }}>
          {message}
        </div>
      )}
    </section>
  );
};

export default ReservationSystem;
