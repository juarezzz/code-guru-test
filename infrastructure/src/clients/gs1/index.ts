/* ---------- External ---------- */
import axios from 'axios';

/* ---------- Client ---------- */
export const gs1_client = axios.create({
  baseURL: 'https://gtincheck.gs1uk.org',
  headers: {
    Authorization: `Bearer ${process.env.GS1_API_ACCESS_TOKEN}`,
  },
});
