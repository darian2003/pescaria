import { Pool } from "pg"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false, // pune true + rejectUnauthorized dacă e hosting extern cu SSL
})

async function runMigration(fileName: string) {
  const filePath = path.join(__dirname, "../../migrations", fileName)
  const sql = fs.readFileSync(filePath, "utf8")
  await pool.query(sql)
  console.log(`✅ Ran migration: ${fileName}`)
}

async function initializeDatabase() {
  try {
    await runMigration("001_create_tables.sql")
    await runMigration("002_insert_initial_data.sql")
    await runMigration("003_insert_admin_user.sql")
    await runMigration("006_add_extra_beds.sql")

    console.log("✅ All migrations executed successfully.")
  } catch (error) {
    console.error("❌ Error during database initialization:", error)
    throw error
  } finally {
    await pool.end()
  }
}

initializeDatabase()
