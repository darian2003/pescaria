import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes"
import umbrellaRoutes from "./routes/umbrella.routes"
import reportsRoutes from "./routes/reports.routes"
import { scheduleMidnightReset } from "./services/scheduler.service"

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
  res.send("🌴 Backend is running!");
});

app.use("/login", authRoutes)
app.use("/umbrellas", umbrellaRoutes);
app.use("/umbrellas", reportsRoutes);

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
  // Start the midnight scheduler
  scheduleMidnightReset()
  console.log("🕛 Midnight scheduler started")
})



