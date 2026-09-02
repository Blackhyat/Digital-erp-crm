import { Router } from "express";
import { createSalesChallan, getSalesChallans, updateSalesChallanStatus, } from "./sales-challan.controller.js";
const router = Router();
router.post("/", createSalesChallan);
router.get("/", getSalesChallans);
router.patch("/:id/status", updateSalesChallanStatus);
export default router;
