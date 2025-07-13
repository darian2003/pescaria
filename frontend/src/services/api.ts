const BASE_URL = "http://localhost:3001"; // actualizează cu URL real dacă e deployat

const getToken = () => localStorage.getItem("token");

export const fetchUmbrellas = async () => {
  const res = await fetch(`${BASE_URL}/umbrellas`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.json();
};

export const occupyBed = async (umbrellaId: number, side: string) => {
  return fetch(`${BASE_URL}/umbrellas/occupy/${umbrellaId}/${side}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const freeBed = async (umbrellaId: number, side: string) => {
  return fetch(`${BASE_URL}/umbrellas/free/${umbrellaId}/${side}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export async function rentBed(umbrellaId: number, side: string) {
    const res = await fetch(`${BASE_URL}/rent/${umbrellaId}/${side}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Eroare la închiriere");
  }
  

export const endRent = async (umbrellaId: number, side: string) => {
  return fetch(`${BASE_URL}/umbrellas/rent/end/${umbrellaId}/${side}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const resetAll = async () => {
  return fetch(`${BASE_URL}/umbrellas/reset`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const fetchReport = async () => {
  const res = await fetch(`${BASE_URL}/umbrellas/report`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.json();
};

export async function resetDay() {
    const res = await fetch(`${BASE_URL}/reset`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Eroare la resetare");
  }
  
