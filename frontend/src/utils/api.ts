// src/utils/api.ts

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
  
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  
    const response = await fetch(url, { ...options, headers });
  
    if (response.status === 401) {
      // Sesiune expirată → delogare
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Sesiunea a expirat. Relogare necesară.');
    }
  
    return response;
  }
  