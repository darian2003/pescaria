"use client"

import { useEffect, useState } from "react"
import type { Umbrella, BedStatus } from "../types"
import UmbrellaMap from "../components/UmbrellaMap"
import UmbrellaActionsModal from "../components/UmbrellaActionsModal"
import { fetchUmbrellas } from "../services/umbrella.service"

export default function StaffPage() {
  const [umbrellas, setUmbrellas] = useState<Umbrella[]>([])
  const [selected, setSelected] = useState<Umbrella | null>(null)
  const [username, setUsername] = useState<string>("")

  // Convertește orice status API la BedStatus din types.ts
  function mapStatus(raw: string): BedStatus {
    if (raw === "rented_hotel") return "rented_hotel"
    if (raw === "occupied" || raw === "rented" || raw === "rented_beach") return "rented_beach"
    return "free"
  }

  const load = async () => {
    // fetchUmbrellas() returnează un array de JS plain,
    // așa că-l forțăm la any[] ca să putem itera peste el
    const rawData = (await fetchUmbrellas()) as any[]

    const mapped: Umbrella[] = rawData.map((u) => ({
      id: u.id,
      umbrella_number: u.umbrella_number,
      extra_beds: u.extra_beds || 0,
      extra_beds_data: u.extra_beds_data || [],
      beds: (u.beds as any[]).map((b) => ({
        side: b.side,
        status: mapStatus(b.status),
        rented_by_username: b.rented_by_username, // Map the username from backend
      })),
    }))

    setUmbrellas(mapped)
  }

  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    if (storedUsername) {
      setUsername(storedUsername)
    }
    load() // Load umbrellas after username is set
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER STAFF */}
      <div className="sticky top-0 z-10 bg-white border-b shadow px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-green-700">Staff: {username}</div>
        <div className="flex flex-1 justify-center">{/* Butonul de vizualizare a fost eliminat */}</div>
        <button
          className="bg-red-500 text-white text-sm px-4 py-2 rounded shadow hover:bg-red-600 transition"
          onClick={() => {
            localStorage.removeItem("token")
            localStorage.removeItem("role")
            window.location.href = "/"
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
          // ȘTERGE prop-ul viewMode
        />
      </div>

      {/* MODAL ACȚIUNI */}
      {selected && (
        <UmbrellaActionsModal
          umbrella={selected}
          onClose={() => setSelected(null)}
          onRefresh={load}
          onBalanceUpdate={undefined}
          staffUsername={username} // Pass the username here
        />
      )}
    </div>
  )
}
