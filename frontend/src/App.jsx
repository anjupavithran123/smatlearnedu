import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./auth/login";
import Signup from "./auth/signup";
import Course from "./pages/Courses";
import Course1 from "./pages/cours";
import InstructorDashboard from "./pages/InstructorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import QuizPage from "./pages/QuizPage";
import CreateQuiz from "./components/CreateQuiz";
import QuizEditPage from "./components/quizedit";
import AdminDashboard from "./pages/AdminDashboard"; // ✅ Instructor analytics view

import { setAuthToken } from "./lib/api";

// Protected Route wrapper
function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  // attach token on app load
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);

  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- Public routes ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/course1" element={<Course1 />} />
       
        <Route path="/courses/:id" element={<Course />} />

        {/* ---------- Student Dashboard ---------- */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* ---------- Instructor Dashboard ---------- */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute role="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ Instructor’s Analytics / Admin Dashboard (charts, stats, etc.) */}
        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute role="instructor">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ---------- Quiz Management for Instructors ---------- */}
        <Route
          path="/instructor/course/:courseId/quiz/create"
          element={
            <ProtectedRoute role="instructor">
              <CreateQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/quiz/:quizId/edit"
          element={<QuizEditPage />}
        />

        {/* ---------- Student Quiz Page ---------- */}
        <Route path="/quiz/:id" element={<QuizPage />} />

        {/* ---------- Fallback ---------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
