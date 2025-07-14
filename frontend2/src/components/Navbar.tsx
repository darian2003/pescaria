import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [role, setRole] = useState(() => localStorage.getItem('role'));

  useEffect(() => {
    const updateRole = () => setRole(localStorage.getItem('role'));
    window.addEventListener('storage', updateRole);
    // Also update on mount in case role changes in-app
    updateRole();
    return () => window.removeEventListener('storage', updateRole);
  }, []);

  if (role !== 'admin') return null;
  return (
    <nav className="bg-gray-800 p-4 flex gap-4 text-white">
      <Link to="/admin" className="hover:underline">Hartă</Link>
      <Link to="/reports" className="hover:underline">Rapoarte</Link>
    </nav>
  );
}
