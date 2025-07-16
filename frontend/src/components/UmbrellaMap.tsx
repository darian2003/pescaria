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
    <div className="grid grid-cols-10 gap-2 p-1 sm:gap-3 sm:p-4 justify-items-center w-full overflow-x-auto">
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
