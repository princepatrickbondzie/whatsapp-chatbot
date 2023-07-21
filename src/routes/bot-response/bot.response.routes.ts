import express from "express";
import {
  createBR,
  deleteBR,
  getAllBRs,
  getSingleBR,
  updateBR,
} from "../../controllers/bot-response/bot.response";

const router = express.Router();

router.get("/", getAllBRs);
router.post("/", createBR);
router.get("/:id", getSingleBR);
router.patch("/:id", updateBR);
router.delete("/:id", deleteBR);

export default router;
