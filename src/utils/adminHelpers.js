const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export const toYmd = (value) => {
  if (!value) return '';
  const str = String(value);
  return str.includes('T') ? str.split('T')[0] : str.slice(0, 10);
};

export const parseLocalDate = (value) => {
  const ymd = toYmd(value);
  if (!ymd) return null;
  return new Date(`${ymd}T00:00:00`);
};

export const formatSkDate = (value) => {
  const d = parseLocalDate(value);
  if (!d) return '';
  return d.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const fetchWithToken = async (url, token, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

export { API_BASE };
