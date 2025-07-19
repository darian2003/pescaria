import express from "express"
import {
  endRent,
  freeBed,
  getAllUmbrellas,
  occupyBed,
  rentBed,
  resetAllUmbrellas,
  getTodayEarnings,
} from "../controllers/umbrella.controller"
import { authMiddleware } from "../middleware/auth.middleware"

const router = express.Router()

router.get("/", authMiddleware, getAllUmbrellas)
router.post("/:umbrellaId/occupy/:side", authMiddleware, occupyBed)
router.post("/:umbrellaId/free/:side", authMiddleware, freeBed)
router.post("/:umbrellaId/rent/:side", authMiddleware, rentBed)
router.post("/:umbrellaId/end-rent/:side", authMiddleware, endRent)
router.post("/reset", authMiddleware, resetAllUmbrellas)
router.get("/earnings", authMiddleware, getTodayEarnings)

export default router
