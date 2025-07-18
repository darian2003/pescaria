// src/types.ts
export type BedStatus = "free" | "rented_beach" | "rented_hotel"

export interface Bed {
  side: "left" | "right"
  status: BedStatus
}

export interface Umbrella {
  id: number
  umbrella_number: number
  beds: Bed[]
}
