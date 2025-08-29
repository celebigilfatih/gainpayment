// Test script for client API
import fetch from 'node-fetch';

async function testClientAPI() {
  try {
    console.log('Testing client API...');
    
    const response = await fetch('http://localhost:3000/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Test Müşteri',
        phoneNumber: '5551234567',
        city: 'İstanbul',
        brokerageFirm: 'İŞ YATIRIM MENKUL DEĞERLER A.Ş.',
        cashPosition: 1000
      }),
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error testing client API:', error);
  }
}

testClientAPI();
