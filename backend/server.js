import './loadEnv.js'; // Import this FIRST
import express from "express";
import cors from "cors";
// import dotenv from "dotenv";
import analyzeRoute from "./routes/analyzeRoute.js";

// dotenv.config();
// console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No'); // Debug line   

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/analyze", analyzeRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});