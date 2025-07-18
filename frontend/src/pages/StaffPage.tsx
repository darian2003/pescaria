"use client"

import { useEffect, useState } from "react"
import type { Umbrella, BedStatus } from "../types"
import UmbrellaMap from "../components/UmbrellaMap"
import UmbrellaActionsModal from "../components/UmbrellaActionsModal"
import { fetchUmbrellas } from "../services/umbrella.service"

export default function StaffPage() {
  const [umbrellas, setUmbrellas] = useState<Umbrella[]>([])
  const [selected, setSelected] = useState<Umbrella | null>(null)
  const [viewMode, setViewMode] = useState<"12x15" | "6x30">("12x15")

  // Convertește orice status API la BedStatus din types.ts
  function mapStatus(raw: string): BedStatus {
    if (raw === "rented_hotel") return "rented_hotel"
    if (raw === "occupied" || raw === "rented" || raw === "rented_beach")
      return "rented_beach"
    return "free"
  }

  const load = async () => {
    // fetchUmbrellas() returnează un array de JS plain, 
    // așa că-l forțăm la any[] ca să putem itera peste el
    const rawData = (await fetchUmbrellas()) as any[]

    const mapped: Umbrella[] = rawData.map((u) => ({
      id: u.id,
      umbrella_number: u.umbrella_number,
      beds: (u.beds as any[]).map((b) => ({
        side: b.side,
        status: mapStatus(b.status),
      })),
    }))

    setUmbrellas(mapped)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER STAFF */}
      <div className="sticky top-0 z-10 bg-white border-b shadow px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-700">Staff</h1>
        <div className="flex flex-1 justify-center">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded-full shadow-sm transition"
            onClick={() =>
              setViewMode((prev) => (prev === "12x15" ? "6x30" : "12x15"))
            }
          >
            Vizualizare: {viewMode === "12x15" ? "6x30" : "12x15"}
          </button>
        </div>
        <button
          className="bg-red-500 text-white text-sm px-4 py-2 rounded shadow hover:bg-red-600 transition"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            window.location.href = "/";
          }}
        >
          Log out
        </button>
      </div>

      {/* HARTA */}
      <div className="p-4 sm:p-6 lg:p-8">
        <UmbrellaMap
          umbrellas={umbrellas}
          onSelect={(u) => setSelected(u)}
          viewMode={viewMode}
        />
      </div>

      {/* MODAL ACȚIUNI */}
      {selected && (
        <UmbrellaActionsModal
          umbrella={selected}
          onClose={() => setSelected(null)}
          onRefresh={load}
          onBalanceUpdate={undefined}
        />
      )}
    </div>
  )
}
