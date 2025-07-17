"use client"

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { X } from "lucide-react"
import { freeBed, rentBed, endRent } from "../services/umbrella.service"

type BedStatus = "free" | "rented_beach" | "rented_hotel"

interface Bed {
  side: "left" | "right"
  status: BedStatus
}

interface Umbrella {
  id: number
  umbrella_number: number
  beds: Bed[]
}

interface Props {
  umbrella: Umbrella
  onClose: () => void
  onRefresh: () => void
  onBalanceUpdate?: (change: number) => void
}

export default function UmbrellaActionsModal({
  umbrella,
  onClose,
  onRefresh,
  onBalanceUpdate,
}: Props) {
  const role = localStorage.getItem("role")
  const [bedStates, setBedStates] = useState<BedStatus[]>([
    umbrella.beds.find((b) => b.side === "left")?.status ?? "free",
    umbrella.beds.find((b) => b.side === "right")?.status ?? "free",
  ])
  const [loading, setLoading] = useState(false)

  // Toggle Liber <-> Ocupat(plajă)
  const toggleBeach = (idx: number) => {
    setBedStates((prev) => {
      const next = [...prev]
      next[idx] = prev[idx] === "free" ? "rented_beach" : "free"
      return next
    })
  }

  // Toggle hotel
  const toggleHotel = (idx: number) => {
    setBedStates((prev) => {
      const next = [...prev]
      next[idx] = prev[idx] === "rented_hotel" ? "free" : "rented_hotel"
      return next
    })
  }

  const hasChanged = () =>
    bedStates.some(
      (s, i) => s !== (umbrella.beds[i]?.status ?? "free")
    )

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const actions: Promise<any>[] = []
      let balanceChange = 0

      umbrella.beds.forEach((b, i) => {
        const orig = b.status
        const neu = bedStates[i]
        if (orig === neu) return

        // Închirieri noi
        if (neu === "rented_beach") {
          actions.push(rentBed(umbrella.id, b.side, "beach"))
          balanceChange += 50
        }
        if (neu === "rented_hotel") {
          actions.push(rentBed(umbrella.id, b.side, "hotel"))
          // fără balanță
        }

        // Eliberări
        if (neu === "free") {
          if (orig === "rented_beach") {
            actions.push(freeBed(umbrella.id, b.side))
          }
          if (orig === "rented_hotel") {
            actions.push(endRent(umbrella.id, b.side))
          }
        }
      })

      await Promise.all(actions)
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

  const statusConfig: Record<BedStatus, { bg: string; text: string }> = {
    free: { bg: "bg-green-600", text: "Liber" },
    rented_beach: { bg: "bg-red-600", text: "Ocupat" },
    rented_hotel: { bg: "bg-blue-600", text: "Hotel" },
  }

  return (
    <Transition.Root show as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        {/* backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* panel */}
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
              {/* header */}
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-xl font-bold text-gray-900">
                  Umbrela #{umbrella.umbrella_number}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {/* beds */}
              <div className="mt-6 grid grid-cols-2 gap-6">
                {umbrella.beds.map((b, i) => {
                  const cfg = statusConfig[bedStates[i]]
                  return (
                    <div
                      key={b.side}
                      className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 p-4"
                    >
                      {/* box click */}
                      <div
                        onClick={() => !loading && toggleBeach(i)}
                        className={`${cfg.bg} flex h-32 w-28 cursor-pointer items-center justify-center rounded border-2 border-gray-300`}
                      >
                        <span className="font-semibold">{cfg.text}</span>
                      </div>
                      {/* hotel btn */}
                      {role === "admin" && (
                        <button
                          onClick={() => !loading && toggleHotel(i)}
                          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          disabled={loading}
                        >
                          Hotel
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* footer */}
              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="rounded bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400 disabled:opacity-50"
                >
                  Renunță
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !hasChanged()}
                  className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Confirmă
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
