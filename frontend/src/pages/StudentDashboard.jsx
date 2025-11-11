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
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-50 via-rose-50 to-violet-50 py-12 px-4">
      {/* decorative blurred blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-300 via-indigo-300 to-purple-400 opacity-25 blur-3xl transform -rotate-12 animate-[spin_80s_linear_infinite]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 w-96 h-96 rounded-full bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 opacity-20 blur-3xl transform rotate-6 animate-[spin_110s_linear_infinite]" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header card */}
        <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 animate-fadeInDown">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-400 text-white rounded-xl p-4 shadow-lg transform transition group-hover:scale-105">
              <FaBook className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Welcome back, {user?.name || "Student"} 🎓
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Continue your learning — pick a quiz or explore courses.
              </p>
            </div>
          </div>

          <div className="ml-auto w-full md:w-auto flex flex-col md:flex-row gap-3">
            <Link
              to="/course1"
              className="flex items-center justify-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-semibold shadow-lg transform hover:-translate-y-0.5 transition"
              aria-label="Browse courses"
            >
              <span>Browse Courses</span>
              <FaChevronRight className="opacity-90" />
            </Link>

            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-700 rounded-lg font-medium hover:shadow transition"
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

        {/* Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quizzes list */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 animate-fadeInUp">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Available Quizzes</h2>
              <div className="text-sm text-gray-500">
                {loading ? "Loading..." : `${debugInfo?.returnedCount ?? quizzes.length} items`}
              </div>
            </div>

            <div className="mb-4">
              {debugInfo?.error ? (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{debugInfo.message || `Error ${debugInfo.status}`}</div>
              ) : (
                <div className="text-sm text-gray-500">Click <span className="font-medium text-gray-700">Take Quiz</span> to begin.</div>
              )}
            </div>

            {/* List / empty state */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 animate-pulse">
                    <div className="w-3/4">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-28 h-10 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : !quizzes.length ? (
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
                      className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm transform transition hover:-translate-y-1 hover:shadow-md"
                      style={{ animation: `fadeInUp 360ms ${idx * 60}ms both` }}
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-md font-medium shadow-lg hover:scale-[1.02] transition-transform active:scale-[0.98]"
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
          <aside className="bg-white rounded-2xl shadow-sm p-6 space-y-4 animate-fadeInRight">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Your Role</div>
                <div className="font-semibold text-gray-800">{user?.role || "student"}</div>
              </div>
              <div className="inline-flex items-center gap-2 animate-pulse-slow">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow">Pro</div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500">Recommended</div>
              <div className="mt-2 text-sm text-gray-600">Try the <span className="font-medium text-gray-800">JavaScript Basics</span> quiz to refresh fundamentals.</div>
            </div>

            <Link
              to="/courses"
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:-translate-y-0.5 transition"
            >
              <FaBook /> Explore Courses
            </Link>
          </aside>
        </div>
      </div>

      {/* animations */}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRight {
          0% { opacity: 0; transform: translateX(12px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 420ms ease both; }
        .animate-fadeInDown { animation: fadeInDown 420ms ease both; }
        .animate-fadeInRight { animation: fadeInRight 420ms ease both; }
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(.4,0,.6,1) infinite; }
      `}</style>
    </div>
  );
}
