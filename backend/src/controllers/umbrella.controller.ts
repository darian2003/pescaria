import type { Request, Response } from "express"
import { Pool } from "pg"
import dotenv from "dotenv"

// Price constants
const HOTEL_RENT_PRICE = 0 // Change as needed
const BEACH_RENT_PRICE = 50 // Change as needed

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
})

// Helper to check if umbrella is non-existent on the map
function isNonExistentUmbrella(umbrellaNumber: number): boolean {
  const cols = 10
  const rows = 17
  const firstRow = 0
  const lastRow = rows - 1
  const row = Math.floor((umbrellaNumber - 1) / cols)
  const col = (umbrellaNumber - 1) % cols
  return (
    (row === firstRow || row === lastRow) && (col === 0 || col === 1)
  )
}

export const getAllUmbrellas = async (req: Request, res: Response) => {
  console.log("[UMBRELLA] getAllUmbrellas called")
  try {
    const result = await pool.query(`
      SELECT u.id AS umbrella_id, u.umbrella_number, u.extra_beds,
             b.id AS bed_id, b.side, b.status, b.rented_by_username
      FROM umbrellas u
      JOIN beds b ON b.umbrella_id = u.id
      ORDER BY u.umbrella_number, b.side
    `)
    
    console.log("[UMBRELLA] Raw database result:", result.rows.slice(0, 3)) // Log first 3 rows for debugging
    
    // Get extra beds data
    const extraBedsResult = await pool.query(`
      SELECT umbrella_id, bed_number, status, rented_by_username
      FROM extra_beds
      ORDER BY umbrella_id, bed_number
    `)
    
    // Grupăm paturile sub umbrele
    const umbrellaMap: Record<number, any> = {}
    result.rows.forEach((row) => {
      const id = row.umbrella_id
      if (!umbrellaMap[id]) {
        console.log(`[UMBRELLA] Creating umbrella ${id}, extra_beds: ${row.extra_beds}, type: ${typeof row.extra_beds}`)
        umbrellaMap[id] = {
          id,
          umbrella_number: row.umbrella_number,
          extra_beds: row.extra_beds,
          beds: [],
          extra_beds_data: []
        }
      }
      umbrellaMap[id].beds.push({
        id: row.bed_id,
        side: row.side,
        status: row.status,
        rented_by_username: row.rented_by_username,
      })
    })
    
    // Add extra beds data
    extraBedsResult.rows.forEach((row) => {
      const umbrellaId = row.umbrella_id
      if (umbrellaMap[umbrellaId]) {
        umbrellaMap[umbrellaId].extra_beds_data.push({
          bed_number: row.bed_number,
          status: row.status,
          rented_by_username: row.rented_by_username,
        })
      }
    })
    
    const umbrellas = Object.values(umbrellaMap)
    console.log("[UMBRELLA] Final umbrellas data (first 2):", umbrellas.slice(0, 2))
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
    // Get umbrella_number for this umbrellaId
    const umbrellaResult = await pool.query(`SELECT umbrella_number FROM umbrellas WHERE id = $1`, [umbrellaId])
    const umbrellaNumber = umbrellaResult.rows[0]?.umbrella_number
    if (umbrellaNumber && isNonExistentUmbrella(umbrellaNumber)) {
      return res.status(400).json({ error: "This umbrella cannot be occupied (non-existent on the map)" })
    }
    const bedResult = await pool.query(`SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`, [umbrellaId, side])
    const bed = bedResult.rows[0]
    if (!bed) {
      return res.status(404).json({ error: "Bed not found" })
    }
    if (bed.status === "rented") {
      return res.status(400).json({ error: "Cannot occupy a rented bed" })
    }
    // Setăm statusul patului pe 'occupied'
    // NOTA: Această funcție nu setează rented_by_username, deoarece frontend-ul folosește rentBed pentru închirieri.
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
    // NOTA: Această funcție este apelată de frontend pentru a elibera paturile "rented_beach".
    // Setăm patul ca "free" și ștergem numele utilizatorului.
    await pool.query(`UPDATE beds SET status = 'free', rented_by_username = NULL WHERE id = $1`, [bed.id]) // <-- Adăugat aici
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
  const { type, username } = req.body // 'hotel' or 'beach', and username <-- Adăugat username
  if (!["left", "right"].includes(side)) {
    return res.status(400).json({ error: "Invalid side" })
  }
  if (type === "hotel" && req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can rent hotel beds" })
  }
  if (type === "beach" && !["admin", "staff"].includes(req.user?.role || "")) {
    return res.status(403).json({ error: "Only admin or staff can rent beach beds" })
  }
  try {
    // Get umbrella_number for this umbrellaId
    const umbrellaResult = await pool.query(`SELECT umbrella_number FROM umbrellas WHERE id = $1`, [umbrellaId])
    const umbrellaNumber = umbrellaResult.rows[0]?.umbrella_number
    if (umbrellaNumber && isNonExistentUmbrella(umbrellaNumber)) {
      return res.status(400).json({ error: "This umbrella cannot be rented (non-existent on the map)" })
    }
    const bedResult = await pool.query(`SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`, [umbrellaId, side])
    const bed = bedResult.rows[0]
    if (!bed) {
      return res.status(404).json({ error: "Bed not found" })
    }
    if (bed.status === "rented_hotel" || bed.status === "rented_beach") {
      return res.status(400).json({ error: "Bed already rented" })
    }
    // Setăm statusul pe 'rented_hotel' sau 'rented_beach' și salvăm numele utilizatorului
    const newStatus = type === "hotel" ? "rented_hotel" : "rented_beach"
    await pool.query(`UPDATE beds SET status = $1, rented_by_username = $2 WHERE id = $3`, [newStatus, username, bed.id]) // <-- Adăugat username
    // Determine price based on type
    const price = type === "hotel" ? HOTEL_RENT_PRICE : BEACH_RENT_PRICE
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
    console.log(`[UMBRELLA] Bed status BEFORE update: ${bed.status} for umbrella ${umbrellaId}, side ${side}`)
    // Setăm statusul pe 'free' și ștergem numele utilizatorului.
    await pool.query(`UPDATE beds SET status = 'free', rented_by_username = NULL WHERE id = $1`, [bed.id]) // <-- Adăugat aici
    const updatedBedResult = await pool.query(`SELECT status FROM beds WHERE id = $1`, [bed.id])
    console.log(
      `[UMBRELLA] Bed status AFTER update: ${updatedBedResult.rows[0].status} for umbrella ${umbrellaId}, side ${side}`,
    )
    // Completăm închirierea activă în rentals
    const updateResult = await pool.query(
      `UPDATE rentals
           SET end_time = NOW(), ended_by = $1
           WHERE umbrella_id = $2 AND side = $3 AND action = 'rented_hotel' AND end_time IS NULL`,
      [req.user!.id, umbrellaId, side],
    )
    if (updateResult.rowCount === 0) {
      // This might happen if the hotel rent was not recorded in rentals (e.g., only status was set by reset)
      // For now, we proceed as the bed status is the primary source for the report count.
      console.warn(
        `[UMBRELLA] No active hotel rent found in rentals for umbrella ${umbrellaId}, side ${side}. Bed status still updated.`,
      )
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
    // 1. Eliberăm toate paturile și ștergem numele utilizatorului
    await pool.query(`UPDATE beds SET status = 'free', rented_by_username = NULL`) // <-- Adăugat aici
    console.log("[UMBRELLA] All beds set to 'free' and usernames cleared.")
    // 2. Calculăm umbrelele care trebuie să fie ocupate de hotel
    const hotelUmbrellaNumbers: number[] = []
    // Primele 4 rânduri (38 umbrele vizibile în total)
    // Rândul 1: umbrelele 3-10 (8 umbrele vizibile)
    for (let col = 2; col < 10; col++) {
      hotelUmbrellaNumbers.push(0 * 10 + col + 1) // row 0, col 2-9 (umbrelele 3-10)
    }
    // Rândurile 2-4: toate cele 10 umbrele de pe fiecare rând (30 umbrele)
    for (let row = 1; row <= 3; row++) {
      for (let col = 0; col < 10; col++) {
        hotelUmbrellaNumbers.push(row * 10 + col + 1) // umbrelele 11-40
      }
    }
    // 3. Setăm statusul la 'rented_hotel' pentru aceste umbrele (ambele paturi)
    // NOTA: Pentru paturile de hotel, rented_by_username rămâne NULL sau poate fi setat la 'Hotel' dacă dorești.
    // Conform cerinței, este vorba de user-ul staff-ului, deci NULL este mai potrivit aici.
    await pool.query(
      `UPDATE beds
         SET status = 'rented_hotel', rented_by_username = NULL
         FROM umbrellas
         WHERE beds.umbrella_id = umbrellas.id
           AND umbrellas.umbrella_number = ANY($1)`,
      [hotelUmbrellaNumbers],
    )
    console.log(`[UMBRELLA] ${hotelUmbrellaNumbers.length} umbrellas set to 'rented_hotel'.`)
    // 4. Șterge TOATE rentals din tabel pentru a reseta balanța la 0
    // Folosim TRUNCATE pentru o resetare completă și definitivă a tabelului
    await pool.query(`TRUNCATE TABLE rentals RESTART IDENTITY;`)
    console.log(`[UMBRELLA] Rentals table truncated and identity restarted. Balance should be 0.`)

    // 5. Șterge toate extra beds și resetează extra_beds la 0 pentru toate umbrelele
    await pool.query(`TRUNCATE TABLE extra_beds RESTART IDENTITY;`)
    await pool.query(`UPDATE umbrellas SET extra_beds = 0;`)
    console.log(`[UMBRELLA] All extra beds deleted and extra_beds count reset to 0 for all umbrellas.`)

    res.json({ message: "All beds reset, hotel beds set, all rentals and extra beds cleared" })
  } catch (err) {
    console.error("Error resetting umbrellas:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getTodayEarnings = async (req: Request, res: Response) => {
  try {
    // Venituri din rentals (paturi normale)
    const rentals = await pool.query(`SELECT price FROM rentals`)
    const rentalsEarnings = rentals.rows.reduce((sum, r) => sum + Number(r.price), 0)

    // Venituri din extra beds (doar cele de plajă)
    const extraBeds = await pool.query(`SELECT SUM(price) as total FROM extra_beds WHERE status = 'rented_beach'`)
    const extraBedsEarnings = extraBeds.rows[0]?.total ? Number(extraBeds.rows[0].total) : 0

    const total_earnings = rentalsEarnings + extraBedsEarnings
    console.log(`[UMBRELLA] Current earnings: ${total_earnings} (rentals: ${rentalsEarnings}, extra beds: ${extraBedsEarnings})`)
    res.json({ total_earnings })
  } catch (err) {
    console.error("Error calculating today's earnings:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Extra beds functionality
export const addExtraBed = async (req: Request, res: Response) => {
  console.log("[UMBRELLA] addExtraBed called with params:", req.params, "body:", req.body)
  const umbrellaId = Number.parseInt(req.params.umbrellaId)
  const { username } = req.body

  if (!["admin", "staff"].includes(req.user?.role || "")) {
    return res.status(403).json({ error: "Only admin or staff can add extra beds" })
  }

  try {
    // Folosește un lock la nivel de umbrelă pentru a preveni race condition la adăugări multiple
    await pool.query('BEGIN');
    await pool.query('LOCK TABLE extra_beds IN EXCLUSIVE MODE');

    // Recalculează mereu max(bed_number) pentru această umbrelă
    const maxBedNumberResult = await pool.query(
      `SELECT MAX(bed_number) as max_bed_number FROM extra_beds WHERE umbrella_id = $1`,
      [umbrellaId]
    );
    const maxBedNumber = maxBedNumberResult.rows[0].max_bed_number || 0;
    const nextBedNumber = Number(maxBedNumber) + 1;

    // Actualizează extra_beds în tabela umbrellas
    const umbrellaResult = await pool.query(`SELECT extra_beds FROM umbrellas WHERE id = $1 FOR UPDATE`, [umbrellaId])
    if (umbrellaResult.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Umbrella not found" })
    }
    const newExtraBeds = umbrellaResult.rows[0].extra_beds + 1;

    // Creează noul extra bed cu bed_number unic
    await pool.query(
      `INSERT INTO extra_beds (umbrella_id, bed_number, status, rented_by_username, started_by, price) 
       VALUES ($1, $2, 'rented_beach', $3, $4, $5)`,
      [umbrellaId, nextBedNumber, username, req.user?.id || null, BEACH_RENT_PRICE]
    )

    await pool.query(`UPDATE umbrellas SET extra_beds = $1 WHERE id = $2`, [newExtraBeds, umbrellaId])

    await pool.query('COMMIT');
    res.json({ message: "Extra bed added successfully", extra_beds: newExtraBeds })
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error("Error adding extra bed:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const removeExtraBed = async (req: Request, res: Response) => {
  console.log("[UMBRELLA] removeExtraBed called with params:", req.params)
  const umbrellaId = Number.parseInt(req.params.umbrellaId)
  
  if (!["admin", "staff"].includes(req.user?.role || "")) {
    return res.status(403).json({ error: "Only admin or staff can remove extra beds" })
  }
  
  try {
    // Get current extra beds count
    const umbrellaResult = await pool.query(`SELECT extra_beds FROM umbrellas WHERE id = $1`, [umbrellaId])
    if (umbrellaResult.rowCount === 0) {
      return res.status(404).json({ error: "Umbrella not found" })
    }
    
    const currentExtraBeds = umbrellaResult.rows[0].extra_beds
    if (currentExtraBeds <= 0) {
      return res.status(400).json({ error: "No extra beds to remove" })
    }
    
    const newExtraBeds = currentExtraBeds - 1
    
    // Check if the last extra bed is currently rented
    const lastExtraBedResult = await pool.query(
      `SELECT status FROM extra_beds WHERE umbrella_id = $1 AND bed_number = $2`,
      [umbrellaId, currentExtraBeds]
    )
    
    if (lastExtraBedResult.rowCount && lastExtraBedResult.rowCount > 0 && lastExtraBedResult.rows[0].status === 'rented_beach') {
      return res.status(400).json({ error: "Cannot remove extra bed while it is rented" })
    }
    
    // Remove the last extra bed
    await pool.query(
      `DELETE FROM extra_beds WHERE umbrella_id = $1 AND bed_number = $2`,
      [umbrellaId, currentExtraBeds]
    )
    
    // Update umbrella with new extra beds count
    await pool.query(`UPDATE umbrellas SET extra_beds = $1 WHERE id = $2`, [newExtraBeds, umbrellaId])
    
    console.log(`[UMBRELLA] Removed extra bed ${currentExtraBeds} from umbrella ${umbrellaId}`)
    res.json({ message: "Extra bed removed successfully", extra_beds: newExtraBeds })
  } catch (err) {
    console.error("Error removing extra bed:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

