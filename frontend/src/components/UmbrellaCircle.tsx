"use client"

import type { BedStatus } from "../types"

interface UmbrellaCircleProps {
  number: number
  leftStatus: BedStatus
  rightStatus: BedStatus
  onClick?: () => void
  invisible?: boolean
}

const statusToColor = {
  free: "#4ade80", // green-400
  rented_beach: "#ef4444", // red-500
  rented_hotel: "#3b82f6", // blue-500
}

export default function UmbrellaCircle({ number, leftStatus, rightStatus, onClick, invisible = false }: UmbrellaCircleProps) {
  if (invisible) {
    return (
      <div
        className="relative w-full h-full aspect-square rounded-full overflow-hidden border border-transparent flex items-center justify-center text-transparent"
        style={{ visibility: 'hidden' }}
      >
        {/* Invisible placeholder that maintains grid spacing */}
        <div className="absolute top-0 left-0 w-1/2 h-full" />
        <div className="absolute top-0 right-0 w-1/2 h-full" />
        <span className="z-10 text-base sm:text-lg md:text-xl font-bold">{number}</span>
      </div>
    )
  }

  return (
    <div
      className="relative w-full h-full aspect-square rounded-full overflow-hidden border border-black cursor-pointer flex items-center justify-center text-white font-bold"
      onClick={onClick}
      title={`Umbrela #${number}`}
    >
      {/* Stânga */}
      <div className="absolute top-0 left-0 w-1/2 h-full" style={{ backgroundColor: statusToColor[leftStatus] }} />
      {/* Dreapta */}
      <div className="absolute top-0 right-0 w-1/2 h-full" style={{ backgroundColor: statusToColor[rightStatus] }} />
      {/* Număr umbrela */}
      <span className="z-10 text-base sm:text-lg md:text-xl font-bold">{number}</span>
    </div>
  )
}
