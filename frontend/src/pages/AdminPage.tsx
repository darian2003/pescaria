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
  const navigate = useNavigate()

  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("dailyBalance")
    return saved ? Number.parseInt(saved) : 0
  })
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showReportConfirm, setShowReportConfirm] = useState(false)
  const [viewMode, setViewMode] = useState<"12x15" | "6x30">("12x15")

  // Salvează balanța în localStorage de fiecare dată când se schimbă
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

  const handleResetConfirm = () => setShowResetConfirm(true)
  const handleReportConfirm = () => setShowReportConfirm(true)

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

  // Funcție pentru actualizarea balanței când se face o închiriere nouă
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header with balance and buttons */}
      <div className="flex flex-col items-center mb-8 bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <span className="text-2xl font-bold text-green-700">
            Balanță zi: <span className="text-green-600">{balance} lei</span>
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg shadow-sm transition-colors duration-200 ease-in-out text-base"
            onClick={handleResetConfirm}
          >
            Reset zi
          </button>
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow-sm transition-colors duration-200 ease-in-out text-base"
            onClick={handleReportConfirm}
          >
            Generează raport
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow-sm transition-colors duration-200 ease-in-out text-base"
            onClick={() => setViewMode((prev) => (prev === "12x15" ? "6x30" : "12x15"))}
          >
            Schimbă Vizualizarea ({viewMode === "12x15" ? "6x30" : "12x15"})
          </button>
        </div>
      </div>

      <UmbrellaMap umbrellas={umbrellas} onSelect={setSelected} viewMode={viewMode} />
      {selected && (
        <UmbrellaActionsModal
          umbrella={selected}
          onClose={() => setSelected(null)}
          onRefresh={load}
          onBalanceUpdate={handleBalanceUpdate}
        />
      )}

      {/* Modal confirmare resetare */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center transform transition-all duration-300 scale-100">
            <h2 className="text-2xl font-bold mb-5 text-yellow-600">Resetare zi</h2>
            <p className="mb-7 text-gray-700 text-lg">Ești sigur că vrei să resetezi ziua?</p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 ease-in-out text-base"
                onClick={handleResetOnly}
              >
                Da
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg transition-colors duration-200 ease-in-out text-base"
                onClick={() => setShowResetConfirm(false)}
              >
                Nu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmare generare raport */}
      {showReportConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center transform transition-all duration-300 scale-100">
            <h2 className="text-2xl font-bold mb-5 text-purple-600">Generare raport</h2>
            <p className="mb-7 text-gray-700 text-lg">Ești sigur că vrei să generezi raportul?</p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 ease-in-out text-base"
                onClick={handleReport}
              >
                Da
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg transition-colors duration-200 ease-in-out text-base"
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
