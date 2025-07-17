"use client"

import { useEffect, useState } from "react"
import UmbrellaMap from "../components/UmbrellaMap"
import UmbrellaActionsModal from "../components/UmbrellaActionsModal"
import { fetchUmbrellas } from "../services/umbrella.service"

interface Bed {
  side: "left" | "right"
  status: "free" | "occupied" | "rented"
}

interface Umbrella {
  id: number
  umbrella_number: number
  beds: Bed[]
}

export default function StaffPage() {
  const [umbrellas, setUmbrellas] = useState<Umbrella[]>([])
  const [selected, setSelected] = useState<Umbrella | null>(null)
  const [viewMode, setViewMode] = useState<"12x15" | "6x30">("12x15")

  const load = async () => {
    const data = await fetchUmbrellas()
    setUmbrellas(data)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-center mb-8 bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Harta Umbrelelor</h1>
        {/* Buton change view pentru staff */}
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow-sm transition-colors duration-200 ease-in-out text-base"
          onClick={() => setViewMode((prev) => (prev === "12x15" ? "6x30" : "12x15"))}
        >
          Schimbă Vizualizarea ({viewMode === "12x15" ? "6x30" : "12x15"})
        </button>
      </div>

      <UmbrellaMap umbrellas={umbrellas} onSelect={setSelected} viewMode={viewMode} />
      {selected && <UmbrellaActionsModal umbrella={selected} onClose={() => setSelected(null)} onRefresh={load} />}
    </div>
  )
}
