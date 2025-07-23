import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth.service';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

 const handleLogin = async () => {
  try {
    const data = await login(username, password);

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);

    
    localStorage.setItem('username', data.user.username);

    if (data.user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/staff');
    }
  } catch (err: any) {
    setError(err.message || 'Eroare la autentificare');
  }
};


  return (
    <div className="flex h-screen items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <input
          className="w-full p-2 border rounded mb-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded mb-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <button
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}
