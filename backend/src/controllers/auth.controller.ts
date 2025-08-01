import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { Pool } from "pg"
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

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body
  console.log("[LOGIN] Attempt with username:", username)

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username])
    console.log("[LOGIN] DB result:", result.rows)

    const user = result.rows[0]

    if (!user || user.password !== password) {
      console.log("[LOGIN] Invalid credentials for username:", username)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: "12h" })
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12h

    await pool.query(`INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`, [
      token,
      user.id,
      expiresAt,
    ])
    console.log("[LOGIN] Login successful for username:", username)

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (err) {
    console.error("[LOGIN] Login error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}
