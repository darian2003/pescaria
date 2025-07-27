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

async function runDropMigration(fileName: string) {
  const filePath = path.join(__dirname, "../../migrations", fileName)
  const sql = fs.readFileSync(filePath, "utf8")
  await pool.query(sql)
  console.log(`✅ Ran drop migration: ${fileName}`)
}

async function dropAllTables() {
  try {
    console.log("🔄 Starting to drop all tables including extra_beds table...")
    
    await runDropMigration("004_drop_all_tables.sql")

    // Verify tables are dropped
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `)
    
    if (result.rows.length === 0) {
      console.log("✅ Verification: No tables remain in the database")
    } else {
      console.log("⚠️  Warning: Some tables still exist:", result.rows.map(row => row.table_name))
    }

    console.log("✅ All tables dropped successfully including extra_beds table.")
  } catch (error) {
    console.error("❌ Error during database cleanup:", error)
    throw error
  } finally {
    await pool.end()
  }
}

dropAllTables() 