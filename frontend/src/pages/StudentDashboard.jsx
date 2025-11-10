// src/components/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaBook, FaSignOutAlt, FaPlus, FaPlay, FaChevronRight } from "react-icons/fa";
import API from "../lib/api"; // Axios instance

export default function StudentDashboard({ courseId }) {
  const navigate = useNavigate();
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : {};

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);

  // Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    let mounted = true;

    const fetchQuizzes = async () => {
      setLoading(true);
      setDebugInfo(null);
      try {
        const url = `/quizzes${courseId ? `?courseId=${courseId}` : ""}`;
        const res = await API.get(url);

        // Defensive extraction: try many common shapes
        let list = [];
        if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.data?.quizzes)) list = res.data.quizzes;
        else if (Array.isArray(res.data?.data?.quizzes)) list = res.data.data.quizzes;
        else if (Array.isArray(res.data?.results)) list = res.data.results;
        else if (Array.isArray(res.data?.data)) list = res.data.data;
        else {
          const maybeArray = Object.values(res.data || {}).find((v) => Array.isArray(v));
          if (maybeArray) list = maybeArray;
        }

        if (!mounted) return;
        setQuizzes(Array.isArray(list) ? list : []);
        setDebugInfo({
          returnedCount: Array.isArray(list) ? list.length : 0,
          error: false,
        });
      } catch (err) {
        console.error("Failed to fetch quizzes", err);
        const status = err.response?.status;
        const message = err.response?.data?.error || err.message || "Failed to load quizzes";
        setDebugInfo({ error: true, status, message });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchQuizzes();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  // Accept object or string for quiz id
  const handleStartQuiz = (quizId) => {
    const id = quizId?._id || quizId?.id || quizId;
    if (!id) {
      alert("Invalid quiz id");
      return;
    }
    navigate(`/quiz/${String(id)}`);
  };

  const handleCreateQuiz = () => {
    navigate(`/instructor/course/${courseId || ""}/quiz/create`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-md p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-400 text-white rounded-xl p-4 shadow-lg">
              <FaBook className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Welcome back, {user?.name || "Student"} 🎓
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Continue your learning journey — pick a quiz or explore courses.
              </p>
            </div>
          </div>

          <div className="ml-auto w-full md:w-auto flex flex-col md:flex-row gap-3">
            {/* Use Link for guaranteed client-side navigation */}
            <Link
              to="/course1"
              className="flex items-center justify-center gap-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold shadow-sm transition transform active:scale-[0.995]"
              aria-label="Browse courses"
            >
              <span>Browse Courses</span>
              <FaChevronRight className="opacity-80" />
            </Link>

            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
            >
              <FaSignOutAlt /> Logout
            </button>

            {user?.role === "instructor" && (
              <button
                type="button"
                onClick={handleCreateQuiz}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-lg font-semibold hover:shadow-md transition"
              >
                <FaPlus /> Create Quiz
              </button>
            )}
          </div>
        </div>

        {/* Content grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quizzes list */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Available Quizzes</h2>
              <div className="text-sm text-gray-500">
                {loading ? "Loading..." : `${debugInfo?.returnedCount ?? quizzes.length} items`}
              </div>
            </div>

            {/* status/debug */}
            <div className="mb-4">
              {debugInfo?.error ? (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{debugInfo.message || `Error ${debugInfo.status}`}</div>
              ) : (
                <div className="text-sm text-gray-500">Click <span className="font-medium text-gray-700">Take Quiz</span> to begin.</div>
              )}
            </div>

            {/* List / empty state */}
            {!loading && quizzes.length === 0 ? (
              <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div className="font-medium">No quizzes available</div>
                <div className="text-sm mt-2">Explore courses to find quizzes or check back later.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((q, idx) => {
                  const id = q?._id || q?.id || q?.quizId || null;
                  const title = q?.title || q?.name || `Quiz #${idx + 1}`;
                  const courseTitle = q?.courseTitle || q?.course || "Unknown Course";
                  const questionCount = q?.questions?.length ?? q?.questionCount ?? "-";

                  return (
                    <div
                      key={id || idx}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:shadow-md transition"
                    >
                      <div>
                        <div className="font-semibold text-gray-800">{title}</div>
                        <div className="text-sm text-gray-500 mt-1">{courseTitle}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500">
                          Questions: <span className="font-medium text-gray-700">{questionCount}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartQuiz(id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition transform active:scale-[0.995]"
                        >
                          <FaPlay /> Take Quiz
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel */}
          <aside className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Your Role</div>
                <div className="font-semibold text-gray-800">{user?.role || "student"}</div>
              </div>
              <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">Pro</div>
            </div>
{/* 
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500">Quizzes Taken</div>
              <div className="text-lg font-bold text-gray-800">{user?.quizzesTaken ?? 0}</div>
            </div> */}

            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500">Recommended</div>
              <div className="mt-2 text-sm text-gray-600">Try the <span className="font-medium text-gray-800">JavaScript Basics</span> quiz to refresh fundamentals.</div>
            </div>

            <Link
              to="/course1"
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 text-orange-600 rounded-lg font-semibold hover:shadow-md transition"
            >
              <FaBook /> Explore Courses
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
