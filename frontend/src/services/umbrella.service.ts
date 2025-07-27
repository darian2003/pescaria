import { fetchWithAuth } from "../utils/api"

const API_BACKEND = import.meta.env.VITE_API_BACKEND

export const fetchUmbrellas = async () => {
  const res = await fetchWithAuth(`${API_BACKEND}/umbrellas`)
  return await res.json()
}

export const resetDay = async () => {
  return fetchWithAuth(`${API_BACKEND}/umbrellas/reset`, { method: "POST" })
}

export const fetchReport = async () => {
  const res = await fetchWithAuth(`${API_BACKEND}/umbrellas/report`)
  return await res.json()
}

export const generateReport = async (date: string) => {
  const res = await fetchWithAuth(`${API_BACKEND}/umbrellas/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  })
  return await res.json()
}

export const occupyBed = async (umbrellaId: number, side: string) => {
  await fetchWithAuth(`${API_BACKEND}/umbrellas/${umbrellaId}/occupy/${side}`, { method: "POST" })
}

export const freeBed = async (umbrellaId: number, side: string) => {
  await fetchWithAuth(`${API_BACKEND}/umbrellas/${umbrellaId}/free/${side}`, { method: "POST" })
}

export const rentBed = async (umbrellaId: number, side: string, type: "hotel" | "beach", username?: string) => {
  await fetchWithAuth(`${API_BACKEND}/umbrellas/${umbrellaId}/rent/${side}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, username }), // ← asigură-te că trimiți username!
  })
}

export const endRent = async (umbrellaId: number, side: string) => {
  await fetchWithAuth(`${API_BACKEND}/umbrellas/${umbrellaId}/end-rent/${side}`, { method: "POST" })
}

export const fetchTodayEarnings = async () => {
  const res = await fetchWithAuth(`${API_BACKEND}/umbrellas/earnings`)
  return await res.json()
}

// This function now simply calls the backend's reset endpoint,
// assuming the backend handles the reservation of 45 hotel umbrellas.
export const resetAndReserveHotelUmbrellas = async () => {
  await resetDay()
}

// Extra beds functionality
export const addExtraBed = async (umbrellaId: number, username?: string) => {
  const res = await fetchWithAuth(`${API_BACKEND}/umbrellas/${umbrellaId}/extra-beds/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  })
  return await res.json()
}

export const removeExtraBed = async (umbrellaId: number) => {
  const res = await fetchWithAuth(`${API_BACKEND}/umbrellas/${umbrellaId}/extra-beds/remove`, { method: "POST" })
  return await res.json()
}


