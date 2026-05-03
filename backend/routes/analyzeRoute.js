import express from "express";
import { analyzeQuery } from "../controllers/analyzeController.js";

const router = express.Router();

router.post("/", analyzeQuery);

export default router;