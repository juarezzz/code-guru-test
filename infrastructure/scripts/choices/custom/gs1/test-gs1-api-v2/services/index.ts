import axios from 'axios';

export const gs1_api = axios.create({
  baseURL: 'https://gtincheck.gs1uk.org',
});
