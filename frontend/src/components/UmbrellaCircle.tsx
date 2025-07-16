"use client"

interface UmbrellaCircleProps {
  number: number
  leftStatus: "free" | "rented_hotel" | "rented_beach"
  rightStatus: "free" | "rented_hotel" | "rented_beach"
  onClick?: () => void
}

const statusToColor = {
  free: "#4ade80", // green-400
  rented_beach: "#ef4444", // red-500
  rented_hotel: "#3b82f6", // blue-500
}

export default function UmbrellaCircle({ number, leftStatus, rightStatus, onClick }: UmbrellaCircleProps) {
  return (
    <div
      className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden border border-black cursor-pointer flex items-center justify-center text-white font-bold text-xs"
      onClick={onClick}
      title={`Umbrela #${number}`}
    >
      {/* Stânga */}
      <div className="absolute top-0 left-0 w-1/2 h-full" style={{ backgroundColor: statusToColor[leftStatus] }} />
      {/* Dreapta */}
      <div className="absolute top-0 right-0 w-1/2 h-full" style={{ backgroundColor: statusToColor[rightStatus] }} />
      {/* Număr umbrela */}
      <span className="z-10 text-xs">{number}</span>
    </div>
  )
}
