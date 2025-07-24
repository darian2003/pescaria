import { fetchWithAuth } from "../utils/api"

const API_BACKEND = import.meta.env.VITE_API_BACKEND

export const fetchUmbrellas = async () => {
  const res = await fetchWithAuth(`${API_BACKEND}/umbrellas`)
  return await res.json()
}

export const resetDay = async () => {
  await fetchWithAuth(`${API_BACKEND}/umbrellas/reset`, { method: "POST" })
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

export const rentBed = async (umbrellaId: number, side: string, type: "hotel" | "beach") => {
  await fetchWithAuth(`${API_BACKEND}/umbrellas/${umbrellaId}/rent/${side}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  })
}

export const endRent = async (umbrellaId: number, side: string) => {
  await fetchWithAuth(`${API_BACKEND}/umbrellas/${umbrellaId}/end-rent/${side}`, { method: "POST" })
}

export const fetchTodayEarnings = async () => {
  const res = await fetchWithAuth(`${API_BACKEND}/umbrellas/earnings`)
  return await res.json()
}

// New function to reset and then reserve specific umbrellas for hotel
export const resetAndReserveHotelUmbrellas = async () => {
  // 1. Reset all umbrellas first
  await resetDay()

  // 2. Define the 45 umbrellas to be reserved for hotel
  const umbrellasToReserve: number[] = []

  // Assuming a 10x17 grid (10 rows, 17 columns)
  const numRows = 10
  const numCols = 17

  // Part 1: First 4 umbrellas from each row (columns 1, 2, 3, 4)
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < 4; col++) {
      // Umbrella numbers are 1-indexed, so (row * numCols) + col + 1
      umbrellasToReserve.push(row * numCols + col + 1)
    }
  }

  // Part 2: First 5 umbrellas from column 5 (rows 1, 2, 3, 4, 5)
  const col5Index = 4 // Column 5 is at index 4 (0-indexed)
  for (let row = 0; row < 5; row++) {
    // Umbrella numbers are 1-indexed, so (row * numCols) + col5Index + 1
    umbrellasToReserve.push(row * numCols + col5Index + 1)
  }

  // Ensure uniqueness (though the logic above should produce unique numbers)
  const uniqueUmbrellas = [...new Set(umbrellasToReserve)]

  // 3. Reserve both beds for each of these umbrellas for 'hotel'
  const reservationPromises: Promise<any>[] = []
  for (const umbrellaNumber of uniqueUmbrellas) {
    reservationPromises.push(rentBed(umbrellaNumber, "left", "hotel"))
    reservationPromises.push(rentBed(umbrellaNumber, "right", "hotel"))
  }

  await Promise.all(reservationPromises)
}
