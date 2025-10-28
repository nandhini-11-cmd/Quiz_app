import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import path from "path";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const __dirname = path.resolve();
app.use((req, res, next) => {
  console.log("[AI DEBUG] Incoming:", req.method, req.url);
  next();
});
app.use("/avatars", express.static(path.join(__dirname, "public/avatars")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use("/api/users", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/upload", uploadRoutes);


app.get("/", (req, res) => {
    res.send("Quiz app backend is running......");
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));