"use client"

import UmbrellaCircle from "./UmbrellaCircle"

type BedStatus = "free" | "occupied" | "rented"

interface Bed {
  side: "left" | "right"
  status: BedStatus
}

interface Umbrella {
  id: number
  umbrella_number: number
  beds: Bed[]
}

interface Props {
  umbrellas: Umbrella[]
  onSelect?: (umbrella: Umbrella) => void
}

export default function UmbrellaMap({ umbrellas, onSelect }: Props) {
  // Creează un array de 180 umbrele (15 rânduri x 12 coloane)
  const createUmbrellaGrid = () => {
    const grid = []
    for (let row = 0; row < 15; row++) {
      const rowUmbrellas = []
      for (let col = 0; col < 12; col++) {
        const umbrellaNumber = row * 12 + col + 1 // Numerotare 1-180
        const existingUmbrella = umbrellas.find((u) => u.umbrella_number === umbrellaNumber)

        if (existingUmbrella) {
          rowUmbrellas.push(existingUmbrella)
        } else {
          // Creează umbrela placeholder dacă nu există în backend
          rowUmbrellas.push({
            id: umbrellaNumber,
            umbrella_number: umbrellaNumber,
            beds: [
              { side: "left" as const, status: "free" as const },
              { side: "right" as const, status: "free" as const },
            ],
          })
        }
      }
      grid.push(rowUmbrellas)
    }
    return grid
  }

  const umbrellaGrid = createUmbrellaGrid()

  return (
    <div className="w-full px-1 sm:px-2 md:px-4">
      <div className="flex flex-col gap-1 sm:gap-2 max-w-full mx-auto">
        {umbrellaGrid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3">
            {row.map((umbrella) => {
              const left = umbrella.beds.find((b) => b.side === "left")?.status ?? "free"
              const right = umbrella.beds.find((b) => b.side === "right")?.status ?? "free"
              return (
                <UmbrellaCircle
                  key={umbrella.id}
                  number={umbrella.umbrella_number}
                  leftStatus={left}
                  rightStatus={right}
                  onClick={() => onSelect?.(umbrella)}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
