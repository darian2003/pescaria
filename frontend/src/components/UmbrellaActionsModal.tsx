"use client"

import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { X } from "lucide-react"
import { freeBed, rentBed, endRent, addExtraBed, removeExtraBed } from "../services/umbrella.service"
import type { Bed, BedStatus, Umbrella } from "../types" // Import Bed type

interface Props {
  umbrella: Umbrella
  onClose: () => void
  onRefresh: () => void
  onBalanceUpdate?: (change: number) => void
  staffUsername?: string // Add this prop
}

export default function UmbrellaActionsModal({ umbrella, onClose, onRefresh, onBalanceUpdate, staffUsername }: Props) {
  // Determină dacă umbrela este de hotel (toate paturile sunt 'rented_hotel')
  const isHotelUmbrella = umbrella.beds.every((bed) => bed.status === 'rented_hotel');
  const role = localStorage.getItem("role")
  const username = staffUsername || localStorage.getItem("username") || "" // Get username from staffUsername prop or localStorage
  // Initialize bedStates with full Bed objects, including rented_by_username
  const [bedStates, setBedStates] = useState<Bed[]>(umbrella.beds.map((bed) => ({ ...bed })))
  const [extraBedsCount, setExtraBedsCount] = useState(umbrella.extra_beds || 0)
  const [loading, setLoading] = useState(false)

  // Debugging: Log initial bed states and role
  useEffect(() => {
    console.log("UmbrellaActionsModal opened for umbrella:", umbrella.umbrella_number)
    console.log("Initial bed states:", bedStates)
    console.log("Current role:", role)
    console.log("Umbrella extra_beds:", umbrella.extra_beds)
    console.log("Extra beds count state:", extraBedsCount)
  }, [umbrella, bedStates, role, extraBedsCount])

  const toggleBeach = (idx: number) => {
    setBedStates((prev) => {
      const next = [...prev]
      const currentStatus = prev[idx].status
      let newStatus: BedStatus = "free"
      let newUsername: string | undefined = undefined

      if (currentStatus === "free") {
        newStatus = "rented_beach"
        newUsername = username // Folosește username-ul corect!
      } else if (currentStatus === "rented_beach") {
        newStatus = "free"
        newUsername = undefined
      } else {
        return prev
      }

      next[idx] = { ...next[idx], status: newStatus, rented_by_username: newUsername }
      return next
    })
  }

  const toggleHotel = (idx: number) => {
    setBedStates((prev) => {
      const next = [...prev]
      const currentStatus = prev[idx].status
      let newStatus: BedStatus = "free"
      let newUsername: string | undefined = undefined

      if (currentStatus === "free") {
        newStatus = "rented_hotel"
        newUsername = username // Folosește username-ul corect!
      } else if (currentStatus === "rented_hotel") {
        newStatus = "free"
        newUsername = undefined
      } else {
        return prev
      }

      next[idx] = { ...next[idx], status: newStatus, rented_by_username: newUsername }
      return next
    })
  }


  const handleConfirm = async () => {
    setLoading(true)
    try {
      const actions: Promise<any>[] = []
      let balanceChange = 0

      // Handle regular beds
      umbrella.beds.forEach((b, i) => {
        const orig = b.status
        const neu = bedStates[i].status // Use status from bedStates
        const newUsername = bedStates[i].rented_by_username // Get username from bedStates

        if (orig === neu) return

        console.log(`Processing bed ${b.side}: ${orig} -> ${neu}`)

        if (neu === "rented_beach") {
          actions.push(rentBed(umbrella.id, b.side, "beach", newUsername)) // pentru plajă
          balanceChange += 50
        } else if (neu === "rented_hotel") {
          actions.push(rentBed(umbrella.id, b.side, "hotel", newUsername)) // pentru hotel
        } else if (neu === "free") {
          if (orig === "rented_beach") {
            actions.push(freeBed(umbrella.id, b.side))
            console.log(`Action: freeBed for ${umbrella.id}, ${b.side}`)
          }
          if (orig === "rented_hotel") {
            actions.push(endRent(umbrella.id, b.side))
            console.log(`Action: endRent for ${umbrella.id}, ${b.side}`)
          }
        }
      })

      // Handle extra beds changes
      console.log(
        `[MODAL] Extra beds comparison: extraBedsCount=${extraBedsCount}, umbrella.extra_beds=${umbrella.extra_beds}`,
      )
      if (extraBedsCount !== umbrella.extra_beds) {
        console.log(`[MODAL] Extra beds changed, processing...`)
        if (extraBedsCount > (umbrella.extra_beds || 0)) {
          // Adding extra beds
          const bedsToAdd = extraBedsCount - (umbrella.extra_beds || 0)
          console.log(`[MODAL] Adding ${bedsToAdd} extra beds`)
          for (let i = 0; i < bedsToAdd; i++) {
            actions.push(addExtraBed(umbrella.id, username))
            balanceChange += 50 // Add 50 lei for each extra bed
          }
        } else {
          // Removing extra beds
          const bedsToRemove = (umbrella.extra_beds || 0) - extraBedsCount
          console.log(`[MODAL] Removing ${bedsToRemove} extra beds`)
          for (let i = 0; i < bedsToRemove; i++) {
            actions.push(removeExtraBed(umbrella.id))
          }
        }
      } else {
        console.log(`[MODAL] Extra beds unchanged`)
      }

      console.log("Actions to perform:", actions)
      await Promise.all(actions)
      if (balanceChange > 0 && onBalanceUpdate) onBalanceUpdate(balanceChange)

      await onRefresh()
      onClose()
    } catch (e: any) {
      console.error("Error during umbrella action:", e)
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
      <Dialog as={Fragment} onClose={onClose}>
        <div className="fixed inset-0 z-50 overflow-y-auto">
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

          {/* panel container */}
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
                  <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                {/* beds */}
                <div className="mt-6 grid grid-cols-2 gap-6">
                  {bedStates.map((bed, i) => {
                    // Iterate over bedStates
                    const cfg = statusConfig[bed.status] // Use bed.status
                    const displayUsername = bed.rented_by_username // Use bed.rented_by_username

                    return (
                      <div
                        key={bed.side}
                        className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 p-4"
                      >
                        {/* This div is for beach rent/free */}
                        <div
                          onClick={() => {
                            // Only allow toggling to beach if current state is free
                            // Or if current state is rented_beach (to free it)
                            // Do not allow toggling from rented_hotel to rented_beach directly
                            if (!loading && (bed.status === "free" || bed.status === "rented_beach")) {
                              toggleBeach(i)
                            }
                          }}
                          className={`${cfg.bg} flex h-32 w-28 cursor-pointer items-center justify-center rounded border-2 border-gray-300 relative`} // Added relative for absolute positioning
                        >
                          <span className="font-semibold">{cfg.text}</span>
                          {displayUsername && (bed.status === "rented_beach" || bed.status === "rented_hotel") && (
                            <span className="absolute bottom-1 text-xs text-white/80">{displayUsername}</span>
                          )}
                        </div>
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

                {/* Extra beds section - ascunsă DOAR pentru staff la umbrele hotel */}
                {!(role === "staff" && isHotelUmbrella) && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Extra Beds
                      {umbrella.extra_beds > 0 && (
                        <span className="text-sm text-gray-600 ml-2">(Currently: {umbrella.extra_beds})</span>
                      )}
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => !loading && setExtraBedsCount((prev) => Math.max(0, prev - 1))}
                        disabled={loading || extraBedsCount <= 0}
                        className="w-12 h-12 rounded-full bg-red-500 text-white font-bold text-xl hover:bg-red-600 disabled:opacity-50"
                      >
                        -
                      </button>
                      <div className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">{extraBedsCount}</div>
                      <button
                        onClick={() => !loading && setExtraBedsCount((prev) => prev + 1)}
                        disabled={loading}
                        className="w-12 h-12 rounded-full bg-green-500 text-white font-bold text-xl hover:bg-green-600 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">Extra Bed</p>
                    {extraBedsCount !== umbrella.extra_beds && (
                      <p className="text-sm text-blue-600 text-center mt-1 font-medium">
                        {extraBedsCount > umbrella.extra_beds
                          ? `Adding ${extraBedsCount - umbrella.extra_beds} extra bed(s)`
                          : `Removing ${umbrella.extra_beds - extraBedsCount} extra bed(s)`}
                      </p>
                    )}
                  </div>
                )}

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
                    disabled={loading}
                    className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Confirmă
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
