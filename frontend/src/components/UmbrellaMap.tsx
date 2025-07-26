"use client"

import type { Umbrella, BedStatus } from "../types"
import UmbrellaCircle from "./UmbrellaCircle"

interface Props {
  umbrellas: Umbrella[]
  onSelect?: (umbrella: Umbrella) => void
  viewMode?: "10x17" | "5x34"
}

// Mapăm status-urile vechi din API la cele din BedStatus
function mapStatus(raw: string): BedStatus {
  if (raw === "rented_hotel") return "rented_hotel"
  if (raw === "occupied" || raw === "rented" || raw === "rented_beach")
    return "rented_beach"
  return "free"
}

export default function UmbrellaMap({
  umbrellas,
  onSelect,
}: Props) {
  // Construim grila de umbrele
  const createUmbrellaGrid = (): Umbrella[][] => {
    const grid: Umbrella[][] = []
    const rows = 17
    const cols = 10

    for (let row = 0; row < rows; row++) {
      const rowUmbrellas: Umbrella[] = []
      for (let col = 0; col < cols; col++) {
        const umbrellaNumber = row * cols + col + 1
        const umbrella = umbrellas.find(
          (u) => u.umbrella_number === umbrellaNumber
        )
        if (umbrella) {
          rowUmbrellas.push(umbrella)
        } else {
          rowUmbrellas.push({
            id: umbrellaNumber,
            umbrella_number: umbrellaNumber,
            beds: [
              { side: "left", status: "free" },
              { side: "right", status: "free" },
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
          <div
            key={rowIndex}
            className="flex justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3"
          >
            {row.map((umbrella, colIndex) => {
              const left = mapStatus(
                umbrella.beds.find((b) => b.side === "left")?.status ?? "free"
              )
              const right = mapStatus(
                umbrella.beds.find((b) => b.side === "right")?.status ?? "free"
              )

              // Check if this umbrella should be invisible (first two columns of first/last row)
              const isInvisible = ((rowIndex === 0 || rowIndex === 16) && (colIndex === 0 || colIndex === 1))

              return (
                <UmbrellaCircle
                  key={umbrella.id}
                  number={umbrella.umbrella_number}
                  leftStatus={left}
                  rightStatus={right}
                  onClick={isInvisible ? undefined : () => onSelect?.(umbrella)}
                  invisible={isInvisible}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
