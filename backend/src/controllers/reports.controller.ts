import type { Request, Response } from "express";
import { Pool } from "pg";
import { DateTime } from 'luxon';
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
});

export const generateReport = async (req: Request, res: Response) => {
  console.log("[REPORTS] generateReport called with body:", req.body, "user:", req.user)
  const { date } = req.body; // Expecting 'YYYY-MM-DD'
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Only admin can generate reports" });
  // Query rentals for the given day
  const rentals = await pool.query(`
    SELECT r.*, u.username
    FROM rentals r
    LEFT JOIN users u ON r.started_by = u.id
    WHERE r.start_time::date = $1
  `, [date]);
  // Calculate stats
  const total_rented_hotel = rentals.rows.filter(r => r.action === 'rented_hotel').length;
  const total_rented_beach = rentals.rows.filter(r => r.action === 'rented_beach').length;
  const total_earnings = rentals.rows.reduce((sum, r) => sum + Number(r.price), 0);
  // Staff stats
  const staffMap: Record<string, { staff_id: number; username: string; count: number }> = {};
  rentals.rows.forEach(r => {
    if (r.started_by && r.username) {
      if (!staffMap[r.started_by]) staffMap[r.started_by] = { staff_id: r.started_by, username: r.username, count: 0 };
      staffMap[r.started_by].count += 1;
    }
  });
  const staff_stats = Object.values(staffMap);
  // Save report
  await pool.query(`
    INSERT INTO daily_reports (report_date, total_rented_beach, total_rented_hotel, total_earnings, staff_stats)
    VALUES ($1, $2, $3, $4, $5)
  `, [date, total_rented_beach, total_rented_hotel, total_earnings, JSON.stringify(staff_stats)]);
  res.json({ report_date: date, total_rented_hotel, total_rented_beach, total_earnings, staff_stats });
};

export const getAllReports = async (req: Request, res: Response) => {
  console.log("[REPORTS] getAllReports called")
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can view reports" });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM daily_reports ORDER BY generated_at DESC`
    );
    // Use generated_at for display, convert to ISO string in Europe/Bucharest timezone
    const reports = result.rows.map((row) => ({
      ...row,
      generated_at: DateTime.fromJSDate(new Date(row.generated_at)).setZone('Europe/Bucharest').toISO(),
    }));
    res.json(reports);
  } catch (err) {
    console.error("[REPORTS] Error fetching reports:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  console.log("[REPORTS] deleteReport called with params:", req.params)
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can delete reports" });
  }
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM daily_reports WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("[REPORTS] Error deleting report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}; 