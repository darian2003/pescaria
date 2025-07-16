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
  viewMode?: "12x15" | "6x30"
}

export default function UmbrellaMap({ umbrellas, onSelect, viewMode = "12x15" }: Props) {
  // Creează grid-ul în funcție de viewMode
  const createUmbrellaGrid = () => {
    const grid = []
    if (viewMode === "12x15") {
      for (let row = 0; row < 15; row++) {
        const rowUmbrellas = []
        for (let col = 0; col < 12; col++) {
          const umbrellaNumber = row * 12 + col + 1
          const existingUmbrella = umbrellas.find((u) => u.umbrella_number === umbrellaNumber)
          rowUmbrellas.push(
            existingUmbrella ?? {
              id: umbrellaNumber,
              umbrella_number: umbrellaNumber,
              beds: [
                { side: "left" as const, status: "free" as const },
                { side: "right" as const, status: "free" as const },
              ],
            }
          )
        }
        grid.push(rowUmbrellas)
      }
    } else {
      for (let row = 0; row < 30; row++) {
        const rowUmbrellas = []
        for (let col = 0; col < 6; col++) {
          const umbrellaNumber = row * 6 + col + 1
          const existingUmbrella = umbrellas.find((u) => u.umbrella_number === umbrellaNumber)
          rowUmbrellas.push(
            existingUmbrella ?? {
              id: umbrellaNumber,
              umbrella_number: umbrellaNumber,
              beds: [
                { side: "left" as const, status: "free" as const },
                { side: "right" as const, status: "free" as const },
              ],
            }
          )
        }
        grid.push(rowUmbrellas)
      }
    }
    return grid
  }

  const umbrellaGrid = createUmbrellaGrid()
  const circleSizeClass = viewMode === "6x30" ? "w-16 h-16" : "w-10 h-10"

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
                  sizeClass={circleSizeClass}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
