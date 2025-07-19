import express from "express";
import { generateReport, getAllReports, deleteReport } from "../controllers/reports.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/report", authMiddleware, generateReport);
router.get("/reports", authMiddleware, getAllReports);
router.delete("/reports/:id", authMiddleware, deleteReport);

export default router; 