// Súbor na testovanie API z príkazového riadka
// Spustite: node test-api.js

const http = require('http');

const API_URL = 'http://localhost:5000';

// Test login
async function testLogin() {
  console.log('\n🔐 TEST: Login...');
  
  const loginData = JSON.stringify({
    email: 'ucitel@skolka.sk',
    password: 'user123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Login úspešný!');
          console.log('Token:', result.token?.substring(0, 20) + '...');
          console.log('Užívateľ:', result.user);
          resolve(result.token);
        } catch (e) {
          console.log('❌ Chyba:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Chyba pripojenia:', error.message);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

// Test vytvorenia rezervácie
async function testReservation(token) {
  console.log('\n📅 TEST: Vytvorenie rezervácie...');
  
  const reservationData = JSON.stringify({
    datum: '2025-12-25',
    cas_od: '10:00',
    cas_do: '11:00',
    poznamka: 'Test rezervácia',
    id_psychologicky: 1
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/reservations',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': reservationData.length
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log('✅ Rezervácia vytvorená!');
            console.log('Dáta:', result.reservation);
          } else {
            console.log('❌ Chyba:', result.error || data);
          }
          resolve(result);
        } catch (e) {
          console.log('❌ Chyba parse:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Chyba pripojenia:', error.message);
      resolve(null);
    });

    req.write(reservationData);
    req.end();
  });
}

// Test načítania vlastných rezervácií
async function testMyReservations(token) {
  console.log('\n📋 TEST: Načítanie vlastných rezervácií...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/reservations/my-reservations',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Rezervácie načítané!');
          console.log('Počet:', Array.isArray(result) ? result.length : 0);
          if (Array.isArray(result) && result.length > 0) {
            console.log('Prvá rezervácia:', result[0]);
          }
          resolve(result);
        } catch (e) {
          console.log('❌ Chyba:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Chyba pripojenia:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Hlavný test
async function runTests() {
  console.log('='.repeat(50));
  console.log('🚀 E-PSYCHOLOG API TEST');
  console.log('='.repeat(50));

  const token = await testLogin();
  
  if (token) {
    await testReservation(token);
    await testMyReservations(token);
  } else {
    console.log('\n❌ Skúšky nemohli pokračovať bez tokenu');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Testy ukončené');
  console.log('='.repeat(50));
}

runTests();
