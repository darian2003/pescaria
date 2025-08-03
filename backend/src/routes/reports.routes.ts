import express from "express";
import { generateReport, getAllReports, deleteReport } from "../controllers/reports.controller";
import { manualMidnightReset } from "../services/scheduler.service";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/report", authMiddleware, generateReport);
router.get("/reports", authMiddleware, getAllReports);
router.delete("/reports/:id", authMiddleware, deleteReport);

// Manual trigger for midnight reset (admin only, for testing)
router.post("/midnight-reset", authMiddleware, async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admin can trigger midnight reset" });
  }
  
  try {
    await manualMidnightReset();
    res.json({ message: "Midnight reset completed successfully" });
  } catch (err) {
    console.error("Error during manual midnight reset:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 