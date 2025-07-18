"use client"

import type { Umbrella, BedStatus } from "../types"
import UmbrellaCircle from "./UmbrellaCircle"

interface Props {
  umbrellas: Umbrella[]
  onSelect?: (umbrella: Umbrella) => void
  viewMode?: "12x15" | "6x30"
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
  viewMode = "12x15",
}: Props) {
  // Construim grila de umbrele
  const createUmbrellaGrid = (): Umbrella[][] => {
    const grid: Umbrella[][] = []
    const cols = viewMode === "12x15" ? 12 : 6
    const rows = viewMode === "12x15" ? 15 : 30

    for (let row = 0; row < rows; row++) {
      const rowUmbrellas: Umbrella[] = []
      for (let col = 0; col < cols; col++) {
        const umbrellaNumber = row * cols + col + 1
        const existing = umbrellas.find(
          (u) => u.umbrella_number === umbrellaNumber
        )

        // Aplicăm mapStatus pentru fiecare pat
        const beds =
          existing?.beds.map((b) => ({
            side: b.side,
            status: mapStatus(b.status),
          })) ?? [
            { side: "left", status: "free" },
            { side: "right", status: "free" },
          ]

        rowUmbrellas.push({
          id: existing?.id ?? umbrellaNumber,
          umbrella_number: umbrellaNumber,
          beds,
        })
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
            {row.map((umbrella) => {
              const left = mapStatus(
                umbrella.beds.find((b) => b.side === "left")?.status ?? "free"
              )
              const right = mapStatus(
                umbrella.beds.find((b) => b.side === "right")?.status ?? "free"
              )

              return (
                <UmbrellaCircle
                  key={umbrella.id}
                  number={umbrella.umbrella_number}
                  leftStatus={left}
                  rightStatus={right}
                  onClick={() => onSelect?.(umbrella)}
                  viewMode={viewMode} // <-- adaugă aici
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
