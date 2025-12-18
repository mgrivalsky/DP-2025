import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const availableTimes = ["11:30", "12:30", "13:30", "14:30"];

const today = new Date();
const availableDays = [
  new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4),
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6),
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
];

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const ReservationSystem = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const handleReserve = () => {
    if (selectedDate && selectedTime) {
      alert(`Rezervované: ${selectedDate.toDateString()} o ${selectedTime}`);
    } else {
      alert("Prosím vyber dátum aj čas.");
    }
  };

  const handleTimeClick = (time) => {
    if (selectedTime === time) {
      setSelectedTime(null);
    } else {
      setSelectedTime(time);
    }
  };

  const handleDateChange = (date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
      setSelectedTime(null);
    } else {
      setSelectedDate(date);
      setSelectedTime(null);
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
              <div className="time-buttons">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    className={selectedTime === time ? "selected" : ""}
                    onClick={() => handleTimeClick(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <div className="selected-info">
                {selectedTime
                  ? `Vybrané: ${selectedTime} o ${selectedDate.toLocaleDateString()}`
                  : "Prosím vyber čas."}
              </div>
            </>
          ) : (
            <p>Najprv si vyber dátum v kalendári.</p>
          )}
        </div>
      </div>

      <button className="reserve-btn" onClick={handleReserve}>
        Rezervovať
      </button>
    </section>
  );
};

export default ReservationSystem;
