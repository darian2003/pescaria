const API_BACKEND = import.meta.env.VITE_API_BACKEND;

export const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BACKEND}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  
    const data = await res.json();
  
    if (!res.ok) {
      throw new Error(data.error || 'Eroare la login');
    }
  
    return data;
  };
  