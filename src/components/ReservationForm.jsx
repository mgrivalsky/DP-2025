import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    <div style={{maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '10px'}}>
      <h2>Rezervovať sedenie</h2>
      {user && <p style={{color: '#666'}}>Prihlásený: <strong>{user.name}</strong></p>}

      <form onSubmit={handleSubmit}>
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
            Dátum:
          </label>
          <input
            type="date"
            name="datum"
            value={formData.datum}
            onChange={handleChange}
            required
            style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px'}}
          />
        </div>

        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
            Čas od:
          </label>
          <input
            type="time"
            name="cas_od"
            value={formData.cas_od}
            onChange={handleChange}
            required
            style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px'}}
          />
        </div>

        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
            Čas do:
          </label>
          <input
            type="time"
            name="cas_do"
            value={formData.cas_do}
            onChange={handleChange}
            required
            style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px'}}
          />
        </div>

        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
            Poznámka (voliteľné):
          </label>
          <textarea
            name="poznamka"
            value={formData.poznamka}
            onChange={handleChange}
            placeholder="Napríklad dôvod návštevy..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              minHeight: '80px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            background: '#608dfd',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Rezervujem...' : 'Rezervovať'}
        </button>
      </form>

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
