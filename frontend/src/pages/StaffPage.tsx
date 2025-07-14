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
      <UmbrellaMap umbrellas={umbrellas} onSelect={setSelected} />
      {selected && (
        <UmbrellaActionsModal umbrella={selected} onClose={() => setSelected(null)} onRefresh={load} />
      )}
    </div>
  );
}
