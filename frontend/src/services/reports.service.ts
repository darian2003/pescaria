import { fetchWithAuth } from '../utils/api';

const API_BACKEND = import.meta.env.VITE_API_BACKEND;

export const fetchReports = async () => {
  const res = await fetchWithAuth(`${API_BACKEND}/umbrellas/reports`);
  return await res.json();
};

export const deleteReport = async (id: number) => {
  await fetchWithAuth(`${API_BACKEND}/umbrellas/reports/${id}`, {
    method: 'DELETE',
  });
}; 