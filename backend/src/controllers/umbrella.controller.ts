import type { Request, Response } from "express"
import { Pool } from "pg"
import dotenv from "dotenv"
import { DateTime } from 'luxon';

// Price constants
const HOTEL_RENT_PRICE = 0; // Change as needed
const BEACH_RENT_PRICE = 50;  // Change as needed

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
})

export const getAllUmbrellas = async (req: Request, res: Response) => {
  console.log("[UMBRELLA] getAllUmbrellas called")
  try {
    const result = await pool.query(`
      SELECT u.id AS umbrella_id, u.umbrella_number,
             b.id AS bed_id, b.side, b.status
      FROM umbrellas u
      JOIN beds b ON b.umbrella_id = u.id
      ORDER BY u.umbrella_number, b.side
    `)

    // Grupăm paturile sub umbrele
    const umbrellaMap: Record<number, any> = {}

    result.rows.forEach((row) => {
      const id = row.umbrella_id

      if (!umbrellaMap[id]) {
        umbrellaMap[id] = {
          id,
          umbrella_number: row.umbrella_number,
          beds: [],
        }
      }

      umbrellaMap[id].beds.push({
        id: row.bed_id,
        side: row.side,
        status: row.status,
      })
    })

    const umbrellas = Object.values(umbrellaMap)
    res.json(umbrellas)
  } catch (err) {
    console.error("Error fetching umbrellas:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const occupyBed = async (req: Request, res: Response) => {
  console.log("[UMBRELLA] occupyBed called with params:", req.params)
  const umbrellaId = Number.parseInt(req.params.umbrellaId)
  const side = req.params.side

  if (!["left", "right"].includes(side)) {
    return res.status(400).json({ error: "Invalid side" })
  }

  try {
    const bedResult = await pool.query(`SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`, [umbrellaId, side])

    const bed = bedResult.rows[0]

    if (!bed) {
      return res.status(404).json({ error: "Bed not found" })
    }

    if (bed.status === "rented") {
      return res.status(400).json({ error: "Cannot occupy a rented bed" })
    }

    // Setăm statusul patului pe 'occupied'
    await pool.query(`UPDATE beds SET status = 'occupied' WHERE id = $1`, [bed.id])

    // Inserăm acțiunea în rentals
    await pool.query(
      `INSERT INTO rentals (umbrella_id, side, started_by, action, price)
         VALUES ($1, $2, $3, 'occupy', 0)`,
      [umbrellaId, side, req.user!.id],
    )

    res.json({ message: "Bed occupied" })
  } catch (err) {
    console.error("Error occupying bed:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const freeBed = async (req: Request, res: Response) => {
  console.log("[UMBRELLA] freeBed called with params:", req.params)
  const umbrellaId = Number.parseInt(req.params.umbrellaId)
  const side = req.params.side

  if (!["left", "right"].includes(side)) {
    return res.status(400).json({ error: "Invalid side" })
  }

  try {
    const bedResult = await pool.query(`SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`, [umbrellaId, side])

    const bed = bedResult.rows[0]

    if (!bed) {
      return res.status(404).json({ error: "Bed not found" })
    }

    if (bed.status === "rented") {
      return res.status(400).json({ error: "Cannot free a rented bed" })
    }

    // Setăm patul ca "free"
    await pool.query(`UPDATE beds SET status = 'free' WHERE id = $1`, [bed.id])

    // Închidem ultima acțiune de ocupare activă pentru acest pat
    await pool.query(
      `UPDATE rentals
         SET end_time = NOW(), ended_by = $1
         WHERE umbrella_id = $2 AND side = $3 AND action = 'rented_beach' AND end_time IS NULL`,
      [req.user!.id, umbrellaId, side],
    )

    res.json({ message: "Bed freed" })
  } catch (err) {
    console.error("Error freeing bed:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const rentBed = async (req: Request, res: Response) => {
  console.log("[UMBRELLA] rentBed called with params:", req.params, "body:", req.body)
  const umbrellaId = Number.parseInt(req.params.umbrellaId)
  const side = req.params.side
  const { type } = req.body // 'hotel' or 'beach'

  if (!["left", "right"].includes(side)) {
    return res.status(400).json({ error: "Invalid side" })
  }

  if (type === 'hotel' && req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can rent hotel beds" })
  }
  if (type === 'beach' && !['admin', 'staff'].includes(req.user?.role || '')) {
    return res.status(403).json({ error: "Only admin or staff can rent beach beds" })
  }

  try {
    const bedResult = await pool.query(`SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`, [umbrellaId, side])
    const bed = bedResult.rows[0]
    if (!bed) {
      return res.status(404).json({ error: "Bed not found" })
    }
    if (bed.status === "rented_hotel" || bed.status === "rented_beach") {
      return res.status(400).json({ error: "Bed already rented" })
    }
    // Setăm statusul pe 'rented_hotel' sau 'rented_beach'
    let newStatus = type === 'hotel' ? 'rented_hotel' : 'rented_beach';
    await pool.query(`UPDATE beds SET status = $1 WHERE id = $2`, [newStatus, bed.id])
    // Determine price based on type
    let price = type === 'hotel' ? HOTEL_RENT_PRICE : BEACH_RENT_PRICE;
    // Inserăm în rentals
    await pool.query(
      `INSERT INTO rentals (umbrella_id, side, started_by, action, price)
         VALUES ($1, $2, $3, $4, $5)`,
      [umbrellaId, side, req.user!.id, newStatus, price],
    )
    res.json({ message: "Bed rented successfully" })
  } catch (err) {
    console.error("Error renting bed:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const endRent = async (req: Request, res: Response) => {
  console.log("[UMBRELLA] endRent called with params:", req.params)
  const umbrellaId = Number.parseInt(req.params.umbrellaId)
  const side = req.params.side
  if (!["left", "right"].includes(side)) {
    return res.status(400).json({ error: "Invalid side" })
  }
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can end rentals" })
  }
  try {
    const bedResult = await pool.query(`SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`, [umbrellaId, side])
    const bed = bedResult.rows[0]
    if (!bed) {
      return res.status(404).json({ error: "Bed not found" })
    }
    if (bed.status !== "rented_hotel") {
      return res.status(400).json({ error: "This bed is not currently rented from hotel" })
    }
    // Setăm statusul pe 'free'
    await pool.query(`UPDATE beds SET status = 'free' WHERE id = $1`, [bed.id])
    // Completăm închirierea activă în rentals
    const updateResult = await pool.query(
      `UPDATE rentals
         SET end_time = NOW(), ended_by = $1
         WHERE umbrella_id = $2 AND side = $3 AND action = 'rented_hotel' AND end_time IS NULL`,
      [req.user!.id, umbrellaId, side],
    )
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: "No active hotel rent found for this bed" })
    }
    res.json({ message: "Rental ended and bed freed" })
  } catch (err) {
    console.error("Error ending rent:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const resetAllUmbrellas = async (req: Request, res: Response) => {
  console.log("[UMBRELLA] resetAllUmbrellas called by user:", req.user)
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can reset the beach" })
  }

  try {
    // 1. Eliberăm toate paturile
    await pool.query(`UPDATE beds SET status = 'free'`);
    await pool.query(`DELETE FROM rentals WHERE start_time::date = CURRENT_DATE`);

    res.json({ message: "All beds reset and active rentals closed" })
  } catch (err) {
    console.error("Error resetting umbrellas:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getTodayEarnings = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rentals = await pool.query(
      `SELECT price FROM rentals WHERE start_time::date = $1`,
      [today]
    );
    const total_earnings = rentals.rows.reduce((sum, r) => sum + Number(r.price), 0);
    res.json({ total_earnings });
  } catch (err) {
    console.error("Error calculating today's earnings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};