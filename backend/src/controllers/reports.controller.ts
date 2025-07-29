import type { Request, Response } from "express"
import { Pool } from "pg"
import { DateTime } from "luxon"
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
})

export const generateReport = async (req: Request, res: Response) => {
  console.log("[REPORTS] generateReport called with body:", req.body, "user:", req.user)
  const { date } = req.body // Expecting 'YYYY-MM-DD'
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Only admin can generate reports" })

  try {
    // Query rentals for the given day to get beach rentals, earnings, and staff stats
    const rentals = await pool.query(
      `
      SELECT r.*, u.username
      FROM rentals r
      LEFT JOIN users u ON r.started_by = u.id
      WHERE r.start_time::date = $1
    `,
      [date],
    )

    // Calculate total_rented_beach from rentals (transactions)
    const rentalsRowCount = rentals.rowCount ?? 0;
    const total_rented_beach = rentalsRowCount > 0 ? rentals.rows.filter((r) => r.action === "rented_beach").length : 0

    // Calculate total_rented_hotel by querying the current status of beds
    const hotelBedsCountResult = await pool.query(`SELECT COUNT(*) FROM beds WHERE status = 'rented_hotel'`)
    const hotelBedsRowCount = hotelBedsCountResult.rowCount ?? 0;
    const total_rented_hotel = hotelBedsRowCount > 0 ? Number.parseInt(hotelBedsCountResult.rows[0].count) : 0
    console.log(`[REPORTS] Current count of rented_hotel beds from DB: ${total_rented_hotel}`)

    // Calculate extra beds data
    const extraBedsResult = await pool.query(`
      SELECT COUNT(*) as total_rented, SUM(price) as total_earnings
      FROM extra_beds 
      WHERE status = 'rented_beach' AND start_time::date = $1
    `, [date])
    
    const extraBedsRowCount = extraBedsResult.rowCount ?? 0;
    const total_extra_beds_rented = extraBedsRowCount > 0 && extraBedsResult.rows[0].total_rented !== null ? Number.parseInt(extraBedsResult.rows[0].total_rented) : 0
    const total_extra_beds_earnings = extraBedsRowCount > 0 && extraBedsResult.rows[0].total_earnings !== null ? Number(extraBedsResult.rows[0].total_earnings) : 0
    console.log(`[REPORTS] Extra beds rented: ${total_extra_beds_rented}, earnings: ${total_extra_beds_earnings}`)

    // Calculate total_earnings from rentals (transactions) + extra beds
    const total_earnings = (rentalsRowCount > 0 ? rentals.rows.reduce((sum, r) => sum + Number(r.price), 0) : 0) + total_extra_beds_earnings

    // Staff stats: rentals + extra beds (cu detaliu extra in username)
    // 1. Rentals per staff
    const staffMap: Record<string, { staff_id: number; username: string; count: number; extra_beds_count: number }> = {}
    if (rentalsRowCount > 0) {
      rentals.rows.forEach((r) => {
        if (r.started_by && r.username) {
          if (!staffMap[r.started_by]) staffMap[r.started_by] = { staff_id: r.started_by, username: r.username, count: 0, extra_beds_count: 0 }
          staffMap[r.started_by].count += 1
        }
      })
    }

    // 2. Extra beds per staff (for the same day)
    const extraBedsStaffResult = await pool.query(
      `SELECT started_by, u.username, COUNT(*) as count
       FROM extra_beds eb
       LEFT JOIN users u ON eb.started_by = u.id
       WHERE eb.start_time::date = $1 AND eb.started_by IS NOT NULL
       GROUP BY started_by, u.username`,
      [date]
    );
    if ((extraBedsStaffResult.rowCount ?? 0) > 0) {
      extraBedsStaffResult.rows.forEach((row) => {
        if (!row.started_by || !row.username) return;
        if (!staffMap[row.started_by]) {
          staffMap[row.started_by] = { staff_id: row.started_by, username: row.username, count: 0, extra_beds_count: 0 };
        }
        staffMap[row.started_by].count += Number(row.count);
        staffMap[row.started_by].extra_beds_count = Number(row.count);
      });
    }
    // Modific username-ul să includă în paranteză numărul de extra beds dacă există
    const staff_stats = Object.values(staffMap).map(s => ({
      ...s,
      username: s.extra_beds_count > 0 ? `${s.username} (${s.extra_beds_count} extra)` : s.username
    }));

    // Save report
    await pool.query(
      `
      INSERT INTO daily_reports (report_date, total_rented_beach, total_rented_hotel, total_earnings, staff_stats, extra_beds_rented, extra_beds_earnings)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [date, total_rented_beach, total_rented_hotel, total_earnings, JSON.stringify(staff_stats), total_extra_beds_rented, total_extra_beds_earnings],
    )
    res.json({ 
      report_date: date, 
      total_rented_hotel, 
      total_rented_beach, 
      total_earnings, 
      staff_stats,
      extra_beds_rented: total_extra_beds_rented,
      extra_beds_earnings: total_extra_beds_earnings
    })
  } catch (err) {
    console.error("[REPORTS] Error generating report:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getAllReports = async (req: Request, res: Response) => {
  console.log("[REPORTS] getAllReports called")
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can view reports" })
  }
  try {
    const result = await pool.query(`SELECT * FROM daily_reports ORDER BY generated_at DESC`)
    // Use generated_at for display, convert to ISO string in Europe/Bucharest timezone
    const reports = result.rows.map((row) => ({
      ...row,
      generated_at: DateTime.fromJSDate(new Date(row.generated_at)).setZone("Europe/Bucharest").toISO(),
    }))
    res.json(reports)
  } catch (err) {
    console.error("[REPORTS] Error fetching reports:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const deleteReport = async (req: Request, res: Response) => {
  console.log("[REPORTS] deleteReport called with params:", req.params)
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can delete reports" })
  }
  const { id } = req.params
  try {
    await pool.query("DELETE FROM daily_reports WHERE id = $1", [id])
    res.json({ success: true })
  } catch (err) {
    console.error("[REPORTS] Error deleting report:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}
