import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";

dotenv.config();
connectDB();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",                     
  "https://quiznova-ai-powered.netlify.app",   
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS policy: The origin ${origin} is not allowed`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ Optional: helpful debug log
app.use((req, res, next) => {
  console.log("[AI DEBUG]", req.method, req.url);
  next();
});

// ✅ Serve static public assets
const __dirname = path.resolve();
app.use("/avatars", express.static(path.join(__dirname, "public/avatars")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ✅ API Routes
app.use("/api/users", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/upload", uploadRoutes);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ Quiz App backend is running fine!");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
