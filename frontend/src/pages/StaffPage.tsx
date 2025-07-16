import { useEffect, useState } from 'react';
import UmbrellaMap from '../components/UmbrellaMap';
import UmbrellaActionsModal from '../components/UmbrellaActionsModal';
import { fetchUmbrellas } from '../services/umbrella.service';

interface Bed {
  side: 'left' | 'right';
  status: 'free' | 'occupied' | 'rented';
}

interface Umbrella {
  id: number;
  umbrella_number: number;
  beds: Bed[];
}

export default function StaffPage() {
  const [umbrellas, setUmbrellas] = useState<Umbrella[]>([]);
  const [selected, setSelected] = useState<Umbrella | null>(null);
  const [viewMode, setViewMode] = useState<'12x15' | '6x30'>('12x15');

  const load = async () => {
    const data = await fetchUmbrellas();
    setUmbrellas(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-center text-2xl font-bold my-4">Harta Umbrelelor</h1>
      {/* Buton change view pentru staff */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() =>
            setViewMode((prev) => (prev === '12x15' ? '6x30' : '12x15'))
          }
        >
          Change View ({viewMode === '12x15' ? '6x30' : '12x15'})
        </button>
      </div>

      <UmbrellaMap
        umbrellas={umbrellas}
        onSelect={setSelected}
        viewMode={viewMode}
      />
      {selected && (
        <UmbrellaActionsModal umbrella={selected} onClose={() => setSelected(null)} onRefresh={load} />
      )}
    </div>
  );
}
