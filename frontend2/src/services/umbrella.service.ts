import { fetchWithAuth } from '../utils/api';

const API = 'http://localhost:3001';

export const fetchUmbrellas = async () => {
  const res = await fetchWithAuth(`${API}/umbrellas`);
  return await res.json();
};

export const resetDay = async () => {
  await fetchWithAuth(`${API}/umbrellas/reset`, { method: 'POST' });
};

export const fetchReport = async () => {
  const res = await fetchWithAuth(`${API}/umbrellas/report`);
  return await res.json();
};

export const generateReport = async (date: string) => {
  const res = await fetchWithAuth(`${API}/umbrellas/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
  });
  return await res.json();
};

export const occupyBed = async (umbrellaId: number, side: string) => {
  await fetchWithAuth(`${API}/umbrellas/${umbrellaId}/occupy/${side}`, { method: 'POST' });
};

export const freeBed = async (umbrellaId: number, side: string) => {
  await fetchWithAuth(`${API}/umbrellas/${umbrellaId}/free/${side}`, { method: 'POST' });
};

export const rentBed = async (umbrellaId: number, side: string, type: 'hotel' | 'beach') => {
  await fetchWithAuth(`${API}/umbrellas/${umbrellaId}/rent/${side}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
};

export const endRent = async (umbrellaId: number, side: string) => {
  await fetchWithAuth(`${API}/umbrellas/${umbrellaId}/end-rent/${side}`, { method: 'POST' });
};
