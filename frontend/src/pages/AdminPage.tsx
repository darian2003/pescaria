"use client"

import { useEffect, useState } from "react"
import UmbrellaMap from "../components/UmbrellaMap"
import UmbrellaActionsModal from "../components/UmbrellaActionsModal"
import { fetchUmbrellas, resetDay, generateReport } from "../services/umbrella.service"
import { useNavigate } from "react-router-dom"

interface Bed {
  side: "left" | "right"
  status: "free" | "occupied" | "rented" | "rented_hotel" | "rented_beach"
}

interface Umbrella {
  id: number
  umbrella_number: number
  beds: Bed[]
}

export default function AdminPage() {
  const [umbrellas, setUmbrellas] = useState<Umbrella[]>([])
  const [selected, setSelected] = useState<Umbrella | null>(null)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("dailyBalance")
    return saved ? Number.parseInt(saved) : 0
  })

  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showReportConfirm, setShowReportConfirm] = useState(false)
  const [viewMode, setViewMode] = useState<"12x15" | "6x30">("12x15")
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem("dailyBalance", balance.toString())
  }, [balance])

  const load = async () => {
    try {
      const data = await fetchUmbrellas()
      setUmbrellas(data)
    } catch (error) {
      console.error("Eroare la încărcarea datelor:", error)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleResetOnly = async () => {
    try {
      await resetDay()
      setBalance(0)
      localStorage.setItem("dailyBalance", "0")
      await load()
      setShowResetConfirm(false)
      alert("Ziua a fost resetată cu succes!")
    } catch (error) {
      console.error("Eroare la resetarea zilei:", error)
      alert("Eroare la resetarea zilei. Încercați din nou.")
    }
  }

  const handleReport = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      await generateReport(today)
      setReportSuccess(true)
      setShowReportConfirm(false)
    } catch (error) {
      console.error("Eroare la generarea raportului:", error)
      alert("Eroare la generarea raportului. Încercați din nou.")
    }
  }

  const handleBalanceUpdate = (change: number) => {
    setBalance((prev) => prev + change)
  }

  if (reportSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-white p-8 rounded shadow-md w-96 text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-600">Raport generat cu succes!</h2>
          <p className="mb-4">Raportul a fost salvat și poate fi vizualizat în pagina de rapoarte.</p>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => navigate("/reports")}
          >
            Vezi rapoarte
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR DE SUS */}
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-green-700">Admin</div>
        <div className="hidden sm:flex gap-4">
          <button
            onClick={() => navigate("/admin")}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
          >
            Hartă
          </button>
          <button
            onClick={() => navigate("/reports")}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
          >
            Rapoarte
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
          >
            Reset zi
          </button>
          <button
            onClick={() => setShowReportConfirm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
          >
            Generează raport
          </button>
        </div>

        {/* MENIU HAMBURGER */}
        <div className="sm:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-700 text-2xl"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* MENIU HAMBURGER FULLSCREEN */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 text-xl font-semibold text-gray-800">
          <button
            onClick={() => { navigate("/admin"); setMenuOpen(false) }}
            className="bg-green-600 text-white px-6 py-3 rounded shadow hover:bg-green-700 transition w-2/3 text-center"
          >
            Hartă
          </button>
          <button
            onClick={() => { navigate("/reports"); setMenuOpen(false) }}
            className="bg-green-600 text-white px-6 py-3 rounded shadow hover:bg-green-700 transition w-2/3 text-center"
          >
            Rapoarte
          </button>
          <button
            onClick={() => { setShowResetConfirm(true); setMenuOpen(false) }}
            className="bg-green-600 text-white px-6 py-3 rounded shadow hover:bg-green-700 transition w-2/3 text-center"
          >
            Reset zi
          </button>
          <button
            onClick={() => { setShowReportConfirm(true); setMenuOpen(false) }}
            className="bg-green-600 text-white px-6 py-3 rounded shadow hover:bg-green-700 transition w-2/3 text-center"
          >
            Generează raport
          </button>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-6 right-6 text-3xl text-gray-600 hover:text-black"
          >
            ×
          </button>
        </div>
      )}

      {/* BALANȚĂ + VIZUALIZARE */}
      <div className="p-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white shadow-sm mb-6">
        <div className="text-xl font-semibold text-green-700">
          Balanță zi: <span className="text-green-600">{balance} lei</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-4 py-2 rounded-full shadow-sm transition"
            onClick={() => setViewMode((prev) => (prev === "12x15" ? "6x30" : "12x15"))}
          >
            Vizual: {viewMode === "12x15" ? "6x30" : "12x15"}
          </button>
        </div>
      </div>

      {/* HARTA */}
      <div className="px-4 sm:px-6 lg:px-8">
        <UmbrellaMap umbrellas={umbrellas} onSelect={setSelected} viewMode={viewMode} />
      </div>

      {/* MODALE */}
      {selected && (
        <UmbrellaActionsModal
          umbrella={selected}
          onClose={() => setSelected(null)}
          onRefresh={load}
          onBalanceUpdate={handleBalanceUpdate}
        />
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-5 text-yellow-600">Resetare zi</h2>
            <p className="mb-7 text-gray-700 text-lg">Ești sigur că vrei să resetezi ziua?</p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                onClick={handleResetOnly}
              >
                Da
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                onClick={() => setShowResetConfirm(false)}
              >
                Nu
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-5 text-purple-600">Generare raport</h2>
            <p className="mb-7 text-gray-700 text-lg">Ești sigur că vrei să generezi raportul?</p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                onClick={handleReport}
              >
                Da
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                onClick={() => setShowReportConfirm(false)}
              >
                Nu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
