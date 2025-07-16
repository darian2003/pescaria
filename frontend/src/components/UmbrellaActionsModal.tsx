"use client"

import { freeBed, rentBed, endRent } from "../services/umbrella.service"
import { useState } from "react"

type BedStatus = "free" | "rented_hotel" | "rented_beach"

interface Bed {
  side: "left" | "right"
  status: BedStatus
}

interface Umbrella {
  id: number
  umbrella_number: numbera
  beds: Bed[]
}

interface Props {
  umbrella: Umbrella
  onClose: () => void
  onRefresh: () => void
  onBalanceUpdate?: (change: number) => void
}

const statusColors: Record<BedStatus, string> = {
  free: "bg-green-400",
  rented_hotel: "bg-blue-500",
  rented_beach: "bg-red-500",
}

export default function UmbrellaActionsModal({ umbrella, onClose, onRefresh, onBalanceUpdate }: Props) {
  const role = localStorage.getItem("role")
  // Track intended new status for each bed
  const [bedStates, setBedStates] = useState<BedStatus[]>([
    umbrella.beds.find((b) => b.side === "left")?.status ?? "free",
    umbrella.beds.find((b) => b.side === "right")?.status ?? "free",
  ])
  const [loading, setLoading] = useState(false)

  const getPossibleAction = (status: BedStatus, side: "left" | "right", idx: number) => {
    if (status === "free") {
      return [
        (role === "admin" || role === "staff") && (
          <button
            key="beach"
            className="px-3 py-1 bg-red-500 text-white rounded w-full"
            onClick={() => setBedStates((prev) => (idx === 0 ? ["rented_beach", prev[1]] : [prev[0], "rented_beach"]))}
            disabled={loading}
          >
            Ocupă
          </button>
        ),
        role === "admin" && (
          <button
            key="hotel"
            className="px-3 py-1 bg-blue-500 text-white rounded w-full mt-2"
            onClick={() => setBedStates((prev) => (idx === 0 ? ["rented_hotel", prev[1]] : [prev[0], "rented_hotel"]))}
            disabled={loading}
          >
            Închiriază hotel
          </button>
        ),
      ]
    }
    if (status === "rented_beach") {
      return [
        <button
          key="free-beach"
          className="px-3 py-1 bg-green-500 text-white rounded w-full"
          onClick={() => setBedStates((prev) => (idx === 0 ? ["free", prev[1]] : [prev[0], "free"]))}
          disabled={loading}
        >
          Eliberează
        </button>,
      ]
    }
    if (status === "rented_hotel" && role === "admin") {
      return [
        <button
          key="free-hotel"
          className="px-3 py-1 bg-green-500 text-white rounded w-full"
          onClick={() => setBedStates((prev) => (idx === 0 ? ["free", prev[1]] : [prev[0], "free"]))}
          disabled={loading}
        >
          Eliberează
        </button>,
      ]
    }
    return []
  }

  const hasChanged = () => {
    return (
      bedStates[0] !== (umbrella.beds.find((b) => b.side === "left")?.status ?? "free") ||
      bedStates[1] !== (umbrella.beds.find((b) => b.side === "right")?.status ?? "free")
    )
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const actions: Promise<any>[] = []
      let balanceChange = 0

      // Left bed
      const leftOrig = umbrella.beds.find((b) => b.side === "left")?.status ?? "free"
      if (bedStates[0] !== leftOrig) {
        if (bedStates[0] === "rented_beach") {
          actions.push(rentBed(umbrella.id, "left", "beach"))
          balanceChange += 50 // Adaugă 50 lei pentru închiriere nouă
        }
        if (bedStates[0] === "rented_hotel") {
          actions.push(rentBed(umbrella.id, "left", "hotel"))
          // Nu se adaugă nimic pentru hotel (conform config-ului)
        }
        if (bedStates[0] === "free") {
          if (leftOrig === "rented_beach") {
            actions.push(freeBed(umbrella.id, "left"))
            // NU se scade nimic când se eliberează
          }
          if (leftOrig === "rented_hotel") {
            actions.push(endRent(umbrella.id, "left"))
            // NU se scade nimic când se eliberează
          }
        }
      }

      // Right bed
      const rightOrig = umbrella.beds.find((b) => b.side === "right")?.status ?? "free"
      if (bedStates[1] !== rightOrig) {
        if (bedStates[1] === "rented_beach") {
          actions.push(rentBed(umbrella.id, "right", "beach"))
          balanceChange += 50 // Adaugă 50 lei pentru închiriere nouă
        }
        if (bedStates[1] === "rented_hotel") {
          actions.push(rentBed(umbrella.id, "right", "hotel"))
          // Nu se adaugă nimic pentru hotel (conform config-ului)
        }
        if (bedStates[1] === "free") {
          if (rightOrig === "rented_beach") {
            actions.push(freeBed(umbrella.id, "right"))
            // NU se scade nimic când se eliberează
          }
          if (rightOrig === "rented_hotel") {
            actions.push(endRent(umbrella.id, "right"))
            // NU se scade nimic când se eliberează
          }
        }
      }

      await Promise.all(actions)

      // Actualizează balanța doar dacă s-au făcut închirieri noi
      if (balanceChange > 0 && onBalanceUpdate) {
        onBalanceUpdate(balanceChange)
      }

      await onRefresh()
      onClose()
    } catch (e: any) {
      alert(e.message || "Eroare la acțiune")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-10 rounded w-[600px] h-[500px] shadow-lg flex flex-col justify-between">
        <h2 className="text-lg font-bold mb-6 text-center">Umbrela #{umbrella.umbrella_number}</h2>
        <div className="flex flex-row gap-8 justify-center mt-4">
          {[
            ["left", 0],
            ["right", 1],
          ].map(([side, idx]) => {
            const status = bedStates[idx as number] as BedStatus
            return (
              <div key={side} className="flex flex-col items-center w-1/2">
                <div
                  className={`w-32 h-40 rounded mb-4 flex items-center justify-center border-2 border-gray-400 ${statusColors[status]}`}
                >
                  {/* No text inside the rectangle */}
                </div>
                <div className="w-full flex flex-col items-center">
                  {getPossibleAction(status, side as "left" | "right", idx as number)}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-12 mt-12 mb-2 justify-between">
          <button
            className="flex-1 bg-gray-400 text-white py-3 rounded text-lg mr-4"
            onClick={onClose}
            disabled={loading}
          >
            Renunță
          </button>
          <button
            className="flex-1 bg-green-600 text-white py-3 rounded text-lg ml-4 disabled:opacity-50"
            onClick={handleConfirm}
            disabled={loading || !hasChanged()}
          >
            Confirmă
          </button>
        </div>
      </div>
    </div>
  )
}
