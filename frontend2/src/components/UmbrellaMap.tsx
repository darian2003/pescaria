import UmbrellaCircle from './UmbrellaCircle';

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
  umbrellas: Umbrella[];
  onSelect?: (umbrella: Umbrella) => void;
}

export default function UmbrellaMap({ umbrellas, onSelect }: Props) {
  return (
    <div className="grid grid-cols-10 gap-4 p-6 justify-items-center">
      {umbrellas.map((u) => {
        const left = u.beds.find((b) => b.side === 'left')?.status ?? 'free';
        const right = u.beds.find((b) => b.side === 'right')?.status ?? 'free';
        return (
          <UmbrellaCircle
            key={u.id}
            number={u.umbrella_number}
            leftStatus={left}
            rightStatus={right}
            onClick={() => onSelect?.(u)}
          />
        );
      })}
    </div>
  );
}
