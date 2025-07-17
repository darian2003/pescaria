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
      className="relative w-full h-full aspect-square rounded-full overflow-hidden border border-black cursor-pointer flex items-center justify-center text-white font-bold text-[0.6rem] sm:text-xs md:text-sm lg:text-base"
      onClick={onClick}
      title={`Umbrela #${number}`}
    >
      {/* Stânga */}
      <div className="absolute top-0 left-0 w-1/2 h-full" style={{ backgroundColor: statusToColor[leftStatus] }} />
      {/* Dreapta */}
      <div className="absolute top-0 right-0 w-1/2 h-full" style={{ backgroundColor: statusToColor[rightStatus] }} />
      {/* Număr umbrela */}
      <span className="z-10 text-[0.6rem] sm:text-xs md:text-sm lg:text-base">{number}</span>
    </div>
  )
}
