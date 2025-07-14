import express from "express"
import {
  endRent,
  freeBed,
  generateReport,
  getAllUmbrellas,
  occupyBed,
  rentBed,
  resetAllUmbrellas,
  getAllReports,
  deleteReport,
} from "../controllers/umbrella.controller"
import { authMiddleware } from "../middleware/auth.middleware"

const router = express.Router()

router.get("/", authMiddleware, getAllUmbrellas)
router.post("/:umbrellaId/occupy/:side", authMiddleware, occupyBed)
router.post("/:umbrellaId/free/:side", authMiddleware, freeBed)
router.post("/:umbrellaId/rent/:side", authMiddleware, rentBed)
router.post("/:umbrellaId/end-rent/:side", authMiddleware, endRent)
router.post("/reset", authMiddleware, resetAllUmbrellas)
router.post("/report", authMiddleware, generateReport)
router.get("/reports", authMiddleware, getAllReports)
router.delete("/reports/:id", authMiddleware, deleteReport)

export default router
