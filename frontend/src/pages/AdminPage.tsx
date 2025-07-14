import { useEffect, useState } from 'react';
import UmbrellaMap from '../components/UmbrellaMap';
import UmbrellaActionsModal from '../components/UmbrellaActionsModal';
import { fetchUmbrellas, resetDay, generateReport } from '../services/umbrella.service';
import { useNavigate } from 'react-router-dom';

interface Bed {
  side: 'left' | 'right';
  status: 'free' | 'occupied' | 'rented';
}

interface Umbrella {
  id: number;
  umbrella_number: number;
  beds: Bed[];
}

export default function AdminPage() {
  const [umbrellas, setUmbrellas] = useState<Umbrella[]>([]);
  const [selected, setSelected] = useState<Umbrella | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    const data = await fetchUmbrellas();
    setUmbrellas(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleReset = async () => {
    await resetDay();
    await load();
  };

  const handleReport = async () => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await generateReport(today);
    setReportSuccess(true);
  };

  if (reportSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-white p-8 rounded shadow-md w-96 text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-600">Raport generat cu succes!</h2>
          <p className="mb-4">Raportul a fost salvat și poate fi vizualizat în pagina de rapoarte.</p>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => navigate('/reports')}
          >
            Vezi rapoarte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-bold my-4">Harta Umbrelelor</h1>
      <div className="flex justify-center mb-4 gap-4">
        <button className="bg-yellow-500 px-4 py-2 rounded text-white" onClick={handleReset}>
          Reset zi
        </button>
        <button className="bg-purple-600 px-4 py-2 rounded text-white" onClick={handleReport}>
          Generează raport
        </button>
      </div>
      <UmbrellaMap umbrellas={umbrellas} onSelect={setSelected} />
      {selected && (
        <UmbrellaActionsModal umbrella={selected} onClose={() => setSelected(null)} onRefresh={load} />
      )}
    </div>
  );
}
