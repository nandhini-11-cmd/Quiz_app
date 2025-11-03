import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import TeacherDashboard from "./pages/DashboardTeacher";
import StudentDashboard from "./pages/DashboardStudent";
import TeacherCreateQuiz from "./pages/TeacherCreateQuiz";
import TeacherEditQuiz from "./pages/TeacherEditQuiz";
import TakeQuiz from "./pages/TakeQuiz";
import QuizResult from "./pages/QuizResult";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ViewQuiz from "./pages/ViewQuiz";





export default function App() {
  const [user, setUser] = useState(null);

  // ✅ Load user from localStorage on first render
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <>
      {/* ✅ Pass user + setUser to Navbar */}
      <Navbar user={user} setUser={setUser} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        

        
        <Route path="/profile" element={<Profile />} />

        {/* role-based dashboard routing (optional for later) */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/teacher/create" element={<TeacherCreateQuiz />} />
        <Route path="/teacher/edit/:id" element={<TeacherEditQuiz />} />
        <Route path="/student/quiz/:id" element={<TakeQuiz />} />
        <Route path="/teacher/leaderboard" element={<Leaderboard />} />
        <Route path="/student/result" element={<QuizResult />} />
        <Route path="/quiz/:id" element={<ViewQuiz />} />
        {/* fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}