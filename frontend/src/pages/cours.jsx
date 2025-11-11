import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import API from "../lib/api";
import defaultImage from "../assets/onlinelearn.jpg";

export default function CourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchCourses = async () => {
      try {
        const res = await API.get("/courses");
        if (!mounted) return;
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.courses ?? res.data?.data ?? [];
        setCourses(list);
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || "Failed to load courses");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCourses();
    return () => {
      mounted = false;
    };
  }, []);

  const formatPrice = (p) => {
    if (!p || p === 0) return "Free";
    try {
      return (p / 100).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
      });
    } catch {
      return p;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-rose-50 to-violet-50 py-12 px-4">
      {/* decorative blurred blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-300 via-indigo-300 to-purple-400 opacity-30 blur-3xl transform -rotate-12 animate-[spin_70s_linear_infinite]" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 opacity-25 blur-3xl transform rotate-6 animate-[spin_100s_linear_infinite]" />

      <div className="max-w-7xl mx-auto">
        {/* Header with back button placed inside so it doesn't overlap content */}
        <header className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 shadow focus:outline-none focus:ring-2 focus:ring-indigo-300 hover:bg-white transition"
            aria-label="Go back"
          >
            <FaChevronLeft className="w-4 h-4 text-gray-800" />
            <span className="hidden md:inline text-sm font-medium text-gray-800">Back</span>
          </button>

          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Courses
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse the latest courses and start learning today.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm"
              >
                <div className="h-44 bg-gray-200 rounded-md mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="flex justify-between items-center">
                  <div className="h-8 bg-gray-200 rounded w-28" />
                  <div className="h-8 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {error && <div className="text-red-600 mb-4">{error}</div>}

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c, idx) => {
                const id = c._id || c.id;
                const thumbnail = c.thumbnail || c.image || defaultImage;
                const priceLabel = formatPrice(c.price);

                return (
                  <article
                    key={id}
                    className="relative group bg-white rounded-2xl overflow-hidden shadow-lg transform transition hover:-translate-y-2 hover:shadow-2xl will-change-transform"
                    style={{
                      animation: `fadeInUp 500ms ${idx * 80}ms both`,
                    }}
                  >
                    {/* image */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={thumbnail}
                        alt={c.title}
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = defaultImage;
                        }}
                      />

                      {/* overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-60 transition-opacity" />

                      {/* level chip */}
                      <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded-md text-xs font-medium text-gray-800">
                        {c.level || "All levels"}
                      </div>

                      {/* price badge */}
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow">
                        {priceLabel}
                      </div>
                    </div>

                    {/* content */}
                    <div className="p-4 flex flex-col gap-3">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {c.title}
                      </h2>
                      <p className="text-sm text-gray-600 flex-1">
                        {c.description ||
                          c.summary ||
                          "No description provided."}
                      </p>

                      {/* Instructor name */}
                      <div className="text-sm font-medium text-gray-700 italic">
                        By{" "}
                        {c.instructor?.name ||
                          c.createdBy?.name ||
                          "Unknown Instructor"}
                      </div>

                      {/* stats */}
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <div>
                          {(c.durationMinutes &&
                            `${Math.ceil(c.durationMinutes / 60)}h`) ||
                            c.duration ||
                            "—"}
                        </div>
                        <div>•</div>
                        <div>
                          {c.lessonsCount
                            ? `${c.lessonsCount} lessons`
                            : "—"}
                        </div>
                        <div>•</div>
                        <div>
                          {c.enrolledCount
                            ? `${c.enrolledCount} students`
                            : "—"}
                        </div>
                      </div>

                      {/* View Details button */}
                      <div className="mt-3">
                        <Link
                          to={`/courses/${id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium shadow transition transform hover:scale-[1.02]"
                        >
                          View Details
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14" />
                            <path d="M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {!loading && courses.length === 0 && (
              <div className="text-center text-gray-600 mt-8">
                No courses yet. Check back soon or create one.
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
