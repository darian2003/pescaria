import { occupyBed, freeBed, rentBed, endRent } from '../services/umbrella.service';
import { hotel_rent_price, beach_rent_price } from '../config';
import { useState } from 'react';

type BedStatus = 'free' | 'occupied' | 'rented';

interface Bed {
  side: 'left' | 'right';
  status: BedStatus;
}

interface Umbrella {
  id: number;
  umbrella_number: number;
  beds: Bed[];
}

interface Props {
  umbrella: Umbrella;
  onClose: () => void;
  onRefresh: () => void;
}

const statusColors: Record<BedStatus, string> = {
  free: 'bg-green-400',
  occupied: 'bg-red-500',
  rented: 'bg-blue-500',
};

export default function UmbrellaActionsModal({ umbrella, onClose, onRefresh }: Props) {
  const role = localStorage.getItem('role');
  // Track intended new status for each bed
  const [bedStates, setBedStates] = useState<BedStatus[]>([
    umbrella.beds.find((b) => b.side === 'left')?.status ?? 'free',
    umbrella.beds.find((b) => b.side === 'right')?.status ?? 'free',
  ]);
  const [loading, setLoading] = useState(false);

  // Helper to get the next possible action for a bed
  const getPossibleAction = (status: BedStatus, side: 'left' | 'right', idx: number) => {
    if (status === 'free') {
      return [
        <button
          key="occupy"
          className="px-3 py-1 bg-green-500 text-white rounded w-full"
          onClick={() => setBedStates((prev) => idx === 0 ? ['occupied', prev[1]] : [prev[0], 'occupied'])}
          disabled={loading}
        >
          Ocupă
        </button>,
        role === 'admin' && (
          <button
            key="rent"
            className="px-3 py-1 bg-blue-500 text-white rounded w-full mt-2"
            onClick={() => setBedStates((prev) => idx === 0 ? ['rented', prev[1]] : [prev[0], 'rented'])}
            disabled={loading}
          >
            Închiriază hotel
          </button>
        ),
      ];
    }
    if (status === 'occupied') {
      return [
        <button
          key="free"
          className="px-3 py-1 bg-red-500 text-white rounded w-full"
          onClick={() => setBedStates((prev) => idx === 0 ? ['free', prev[1]] : [prev[0], 'free'])}
          disabled={loading}
        >
          Eliberează
        </button>,
      ];
    }
    if (status === 'rented' && role === 'admin') {
      return [
        <button
          key="free"
          className="px-3 py-1 bg-red-500 text-white rounded w-full"
          onClick={() => setBedStates((prev) => idx === 0 ? ['free', prev[1]] : [prev[0], 'free'])}
          disabled={loading}
        >
          Eliberează
        </button>,
      ];
    }
    return [];
  };

  // Check if any bed state has changed
  const hasChanged = () => {
    return (
      bedStates[0] !== (umbrella.beds.find((b) => b.side === 'left')?.status ?? 'free') ||
      bedStates[1] !== (umbrella.beds.find((b) => b.side === 'right')?.status ?? 'free')
    );
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const actions: Promise<any>[] = [];
      // Left bed
      const leftOrig = umbrella.beds.find((b) => b.side === 'left')?.status ?? 'free';
      if (bedStates[0] !== leftOrig) {
        if (bedStates[0] === 'occupied') actions.push(occupyBed(umbrella.id, 'left'));
        if (bedStates[0] === 'free') {
          if (leftOrig === 'occupied') actions.push(freeBed(umbrella.id, 'left'));
          if (leftOrig === 'rented') actions.push(endRent(umbrella.id, 'left'));
        }
        if (bedStates[0] === 'rented') {
          actions.push(rentBed(umbrella.id, 'left', 'hotel'));
        }
      }
      // Right bed
      const rightOrig = umbrella.beds.find((b) => b.side === 'right')?.status ?? 'free';
      if (bedStates[1] !== rightOrig) {
        if (bedStates[1] === 'occupied') actions.push(occupyBed(umbrella.id, 'right'));
        if (bedStates[1] === 'free') {
          if (rightOrig === 'occupied') actions.push(freeBed(umbrella.id, 'right'));
          if (rightOrig === 'rented') actions.push(endRent(umbrella.id, 'right'));
        }
        if (bedStates[1] === 'rented') {
          actions.push(rentBed(umbrella.id, 'right', 'hotel'));
        }
      }
      await Promise.all(actions);
      await onRefresh();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Eroare la acțiune');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-10 rounded w-[600px] h-[500px] shadow-lg flex flex-col justify-between">
        <h2 className="text-lg font-bold mb-6 text-center">Umbrela #{umbrella.umbrella_number}</h2>
        <div className="flex flex-row gap-8 justify-center mt-4">
          {[['left', 0], ['right', 1]].map(([side, idx]) => {
            const status = bedStates[idx as number];
            return (
              <div key={side} className="flex flex-col items-center w-1/2">
                <div
                  className={`w-32 h-40 rounded mb-4 flex items-center justify-center border-2 border-gray-400 ${statusColors[status as BedStatus]}`}
                >
                  {/* No text inside the rectangle */}
                </div>
                <div className="w-full flex flex-col items-center">
                  {getPossibleAction(status as BedStatus, side as 'left' | 'right', idx as number)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-12 mt-12 mb-2 justify-between">
          <button
            className="flex-1 bg-gray-400 text-white py-3 rounded text-lg mr-4"
            onClick={onClose}
            disabled={loading}
          >
            Renunță
          </button>
          <button
            className="flex-1 bg-green-600 text-white py-3 rounded text-lg ml-4 disabled:opacity-50"
            onClick={handleConfirm}
            disabled={loading || !hasChanged()}
          >
            Confirmă
          </button>
        </div>
      </div>
    </div>
  );
}
