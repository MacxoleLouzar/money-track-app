export const API_URL = 'https://money-track-app-gxez.onrender.com/api';

export const authHeaders = (token, json = true) => ({
  Authorization: `Bearer ${token}`,
  ...(json ? { 'Content-Type': 'application/json' } : {}),
});
