import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAdminPulse() {
  const token = process.env.ADMIN_TOKEN; // I hope I have this or can get it
  const baseUrl = process.env.API_URL || 'http://localhost:3000';

  try {
    const response = await axios.get(`${baseUrl}/api/admin/dashboard/pulse`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Pulse Data:', JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    console.error('Error Status:', err.response?.status);
    console.error('Error Data:', err.response?.data);
  }
}

// testAdminPulse();
console.log('Script created. Please provide a token to test.');
