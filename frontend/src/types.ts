// src/types.ts
export type BedStatus = "free" | "rented_beach" | "rented_hotel"

export interface Bed {
  side: "left" | "right"
  status: BedStatus
  rented_by_username?: string
}

export interface Umbrella {
  id: number
  umbrella_number: number
  beds: Bed[]
}

export interface StaffStat {
  staff_id: number
  username: string
  count: number
}

export interface Report {
  id?: number
  report_date: string
  total_rented_hotel: number
  total_rented_beach: number
  total_earnings: number
  generated_at?: string
  staff_stats: StaffStat[]
}
