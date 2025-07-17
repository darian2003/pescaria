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
    <div className="min-h-screen bg-gray-50">
      {/* HEADER STAFF */}
      <div className="sticky top-0 z-10 bg-white border-b shadow px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-700">Staff</h1>
        <button
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded-full shadow-sm transition"
          onClick={() => setViewMode((prev) => (prev === "12x15" ? "6x30" : "12x15"))}
        >
          Vizualizare: {viewMode === "12x15" ? "6x30" : "12x15"}
        </button>
      </div>

      {/* HARTA SUB HEADER */}
      <div className="p-4 sm:p-6 lg:p-8">
        <UmbrellaMap umbrellas={umbrellas} onSelect={setSelected} viewMode={viewMode} />
      </div>

      {/* MODAL ACȚIUNI */}
      {selected && (
        <UmbrellaActionsModal
          umbrella={selected}
          onClose={() => setSelected(null)}
          onRefresh={load}
        />
      )}
    </div>
  )
}
