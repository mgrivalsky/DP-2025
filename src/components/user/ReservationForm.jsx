import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../styles/ReservationForm.css';

const API_URL = 'http://localhost:5000/api';

export const ReservationForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    datum: '',
    cas_od: '09:00',
    cas_do: '10:00',
    poznamka: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id_psychologicky: 1
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Rezervácia úspešne vytvorená!');
        setFormData({
          datum: '',
          cas_od: '09:00',
          cas_do: '10:00',
          poznamka: ''
        });
      } else {
        setMessage(`❌ Chyba: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Chyba pri vytváraní rezervácie. Skontrolujte server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reservation-form-container">
      <h2>Rezervovať sedenie</h2>
      {user && (
        <p className="reservation-form-user-info">
          Prihlásený: <strong>{user.name}</strong>
        </p>
      )}

      <form className="reservation-form" onSubmit={handleSubmit}>
        <div className="reservation-form-group">
          <label className="reservation-form-label">
            Dátum:
          </label>
          <input
            type="date"
            name="datum"
            value={formData.datum}
            onChange={handleChange}
            required
            className="reservation-form-input"
          />
        </div>

        <div className="reservation-form-group">
          <label className="reservation-form-label">
            Čas od:
          </label>
          <input
            type="time"
            name="cas_od"
            value={formData.cas_od}
            onChange={handleChange}
            required
            className="reservation-form-input"
          />
        </div>

        <div className="reservation-form-group">
          <label className="reservation-form-label">
            Čas do:
          </label>
          <input
            type="time"
            name="cas_do"
            value={formData.cas_do}
            onChange={handleChange}
            required
            className="reservation-form-input"
          />
        </div>

        <div className="reservation-form-group">
          <label className="reservation-form-label">
            Poznámka (voliteľné):
          </label>
          <textarea
            name="poznamka"
            value={formData.poznamka}
            onChange={handleChange}
            placeholder="Napríklad dôvod návštevy..."
            className="reservation-form-textarea"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="reservation-form-submit"
        >
          {loading ? 'Rezervujem...' : 'Rezervovať'}
        </button>
      </form>

      {message && (
        <div className={`reservation-form-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
