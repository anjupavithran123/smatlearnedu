// src/pages/CourseList.jsx
import React, { useEffect, useState } from "react";
import API from "../lib/api";
import { Link } from "react-router-dom";
import defaultImage from "../assets/onlinelearn.jpg";


export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchCourses = async () => {
      try {
        const res = await API.get("/courses");
        if (!mounted) return;
        // Defensive: API might return an array or { courses: [...] }
        const list = Array.isArray(res.data) ? res.data : res.data?.courses ?? res.data?.data ?? [];
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
      return (p / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
    } catch {
      return p;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Courses</h1>
            <p className="text-sm text-gray-500 mt-1">Browse our latest courses and start learning today.</p>
          </div>

          {/* <div className="flex items-center gap-3">
            <Link
              to="/courses?filter=new"
              className="text-sm px-3 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-md hover:shadow transition"
            >
              New
            </Link>
            <Link
              to="/courses?filter=popular"
              className="text-sm px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-md hover:shadow transition"
            >
              Popular
            </Link>
          </div> */}
        </header>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-lg shadow">
                <div className="h-40 bg-gray-200 rounded-md mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="flex justify-between items-center">
                  <div className="h-8 bg-gray-200 rounded w-24" />
                  <div className="h-8 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {error && <div className="text-red-600 mb-4">{error}</div>}

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => {
                const id = c._id || c.id;
                const thumbnail = c.thumbnail || c.image || defaultImage;

                const priceLabel = formatPrice(c.price);

                return (
                  <article
                    key={id}
                    className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition group flex flex-col"
                  >
                    <div className="relative rounded-md overflow-hidden mb-4">
                      <img
                        src={thumbnail}
                        alt={c.title}
                        className="w-full h-40 object-cover object-center"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/placeholder-course.jpg";
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded-md text-xs font-medium text-gray-800">
                        {c.level || "All levels"}
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-semibold bg-orange-500 text-white">
                        {priceLabel}
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">{c.title}</h2>

                    <p className="text-sm text-gray-600 mt-2 line-clamp-3 flex-1">{c.description || c.summary || "No description provided."}</p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-xs text-gray-500">By {c.instructor || c.createdBy?.name || "Unknown"}</div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/courses/${id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition"
                        >
                          View
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                        </Link>

                       
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {!loading && courses.length === 0 && (
              <div className="text-center text-gray-600 mt-8">No courses yet. Check back soon or create one.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
