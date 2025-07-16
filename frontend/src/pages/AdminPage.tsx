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

  const [balance, setBalance] = useState(0)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showReportConfirm, setShowReportConfirm] = useState(false)

  const calculateBalance = (umbrellas: Umbrella[]) => {
    let total = 0
    umbrellas.forEach((umbrella) => {
      umbrella.beds.forEach((bed) => {
        if (bed.status === "rented_hotel") {
          total += 0 // hotel_rent_price
        } else if (bed.status === "rented_beach") {
          total += 50 // beach_rent_price
        }
      })
    })
    return total
  }

  const load = async () => {
    try {
      const data = await fetchUmbrellas()
      setUmbrellas(data)
      const newBalance = calculateBalance(data)
      setBalance(newBalance)
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
    <div>
      <h1 className="text-center text-2xl font-bold my-4">Harta Umbrelelor</h1>
      <div className="text-center mb-4">
        <div className="inline-block bg-green-100 border border-green-400 rounded-lg px-6 py-3">
          <span className="text-lg font-semibold text-green-800">Balanță: {balance} lei</span>
        </div>
      </div>
      <div className="flex justify-center mb-4 gap-4">
        <button className="bg-yellow-500 px-4 py-2 rounded text-white" onClick={handleResetConfirm}>
          Reset zi
        </button>
        <button className="bg-purple-600 px-4 py-2 rounded text-white" onClick={handleReportConfirm}>
          Generează raport
        </button>
      </div>
      <UmbrellaMap umbrellas={umbrellas} onSelect={setSelected} />
      {selected && <UmbrellaActionsModal umbrella={selected} onClose={() => setSelected(null)} onRefresh={load} />}

      {/* Modal confirmare resetare */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-md w-96 text-center">
            <h2 className="text-xl font-bold mb-4 text-yellow-600">Resetare zi</h2>
            <p className="mb-6">Ești sigur că vrei să resetezi ziua?</p>
            <div className="space-x-4">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={handleResetOnly}
              >
                Da
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-md w-96 text-center">
            <h2 className="text-xl font-bold mb-4 text-purple-600">Generare raport</h2>
            <p className="mb-6">Ești sigur că vrei să generezi raportul?</p>
            <div className="space-x-4">
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                onClick={handleReport}
              >
                Da
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
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
