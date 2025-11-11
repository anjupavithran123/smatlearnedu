import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { setAuthToken } from "../lib/api";
import { Eye, Edit, Trash2, PlusCircle } from "lucide-react";

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState({});
  const [form, setForm] = useState({ title: "", description: "", videoLinks: [""], price: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setAuthToken(token);
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/courses");
      const courseList = res.data.courses || [];
      setCourses(courseList);
      courseList.forEach((c) => fetchQuizzesForCourse(c._id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await API.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c._id !== id));
      setQuizzes((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      if (editingId === id) resetForm();
      toggleCreate(false);
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const toggleCreate = (open = null) => {
    const next = open === null ? !showCreate : !!open;
    setShowCreate(next);
    if (next) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const setField = (key, value) => setForm((s) => ({ ...s, [key]: value }));
  const handleVideoChange = (index, value) => {
    setForm((s) => {
      const arr = [...s.videoLinks];
      arr[index] = value;
      return { ...s, videoLinks: arr };
    });
  };
  const addVideoInput = () => setForm((s) => ({ ...s, videoLinks: [...s.videoLinks, ""] }));
  const removeVideoInput = (index) =>
    setForm((s) => {
      const arr = s.videoLinks.filter((_, i) => i !== index);
      return { ...s, videoLinks: arr.length ? arr : [""] };
    });
  const resetForm = () => {
    setForm({ title: "", description: "", videoLinks: [""], price: 0 });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const links = (form.videoLinks || []).map((l) => l.trim()).filter(Boolean);
      const payload = {
        title: form.title,
        description: form.description,
        videoLinks: links,
        price: Math.round(Number(form.price) * 100), // convert ₹ → paise
      };

      if (editingId) {
        await API.put(`/courses/${editingId}`, payload);
      } else {
        await API.post("/courses", payload);
      }

      resetForm();
      toggleCreate(false);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || (editingId ? "Update failed" : "Create failed"));
    }
  };

  const openCreate = () => {
    resetForm();
    setEditingId(null);
    toggleCreate(true);
  };

  const openEdit = (course) => {
    setForm({
      title: course.title || "",
      description: course.description || "",
      videoLinks: Array.isArray(course.videoLinks) && course.videoLinks.length > 0 ? course.videoLinks : [""],
      price: course.price ? course.price / 100 : 0,
    });
    setEditingId(course._id || course.id || null);
    toggleCreate(true);
  };

  const fetchQuizzesForCourse = async (courseId) => {
    if (!courseId) return;
    setLoadingQuizzes((s) => ({ ...s, [courseId]: true }));
    try {
      const res = await API.get(`/quizzes?courseId=${courseId}`);
      const list = res.data.quizzes || res.data.data || [];
      setQuizzes((prev) => ({ ...prev, [courseId]: list }));
    } catch {
      setQuizzes((prev) => ({ ...prev, [courseId]: [] }));
    } finally {
      setLoadingQuizzes((s) => ({ ...s, [courseId]: false }));
    }
  };

  const handleDeleteQuiz = async (quizId, courseId) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await API.delete(`/quizzes/${quizId}`);
      setQuizzes((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] || []).filter((q) => q._id !== quizId),
      }));
    } catch {
      alert("Delete failed");
    }
  };

  const openCreateQuiz = (courseId) => navigate(`/instructor/course/${courseId}/quiz/create`);
  const openEditQuiz = (quizId) => navigate(`/instructor/quiz/${quizId}/edit`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      {/* HEADER — matches Signup/Login header style */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-4">
            <div className="h-15 w-15 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur">
              <span className="text-white font-extrabold">SL</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-extrabold">Smart_Learn</span>
              <span className="text-xs text-white/80">Instructor Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/instructor/dashboard")}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition"
            >
              View Details
            </button>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow"
            >
              <PlusCircle className="w-4 h-4" /> Create Course
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
              }}
              className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* main content with top padding to avoid header overlap */}
      <main className="pt-24 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header row inside page */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Instructor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage courses and quizzes — quick & easy.</p>
            </div>

            <div className="flex items-center gap-3">

              {showCreate && (
                <button
                  onClick={() => {
                    resetForm();
                    toggleCreate(false);
                  }}
                  className="px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Form */}
          <div
            ref={formRef}
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ${showCreate ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="bg-white p-6 rounded-2xl shadow-md mb-8 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{editingId ? "Edit Course" : "Create Course"}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Course Title"
                  className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  required
                />

                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Course Description"
                  className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  rows={4}
                />

                <div>
                  <label className="block font-medium text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    placeholder="Enter 0 for free course"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">Video URLs</label>
                  {form.videoLinks.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center mb-2">
                      <input
                        value={link}
                        onChange={(e) => handleVideoChange(idx, e.target.value)}
                        placeholder={`Video URL #${idx + 1}`}
                        className="flex-1 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeVideoInput(idx)}
                        className="px-3 py-1 border rounded text-sm hover:bg-gray-100 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addVideoInput}
                    className="mt-2 px-3 py-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded text-sm hover:opacity-95 transition"
                  >
                    + Add Video
                  </button>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded text-white font-medium shadow ${
                      editingId ? "bg-indigo-500 hover:bg-indigo-600" : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-95"
                    } transition`}
                  >
                    {editingId ? "Save Changes" : "Create Course"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      toggleCreate(false);
                    }}
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Course List */}
          <section>
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Your Courses</h2>
            {loading && <div className="text-gray-600">Loading...</div>}
            {error && <div className="text-red-600">{error}</div>}

            <div className="grid gap-6">
              {courses.map((c) => (
                <div key={c._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">{c.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{c.description}</div>
                      <div className="text-sm text-gray-500 mt-2">Price: ₹{((c.price || 0) / 100).toFixed(2)}</div>
                      {Array.isArray(c.videoLinks) && c.videoLinks.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {c.videoLinks.length} video{c.videoLinks.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-start md:flex-col gap-2 md:gap-3">
                      <button
                        onClick={() => navigate(`/courses/${c._id}`)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-800 rounded hover:shadow-sm transition"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>

                      <button
                        onClick={() => openEdit(c)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded hover:opacity-95 transition"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>

                      <button
                        onClick={() => handleDelete(c._id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>

                      <button
                        onClick={() => openCreateQuiz(c._id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-800 rounded hover:shadow-sm transition"
                      >
                        <PlusCircle className="w-4 h-4" /> Quiz
                      </button>
                    </div>
                  </div>

                  {/* Quizzes */}
                  <div className="mt-4">
                    <h3 className="font-medium text-sm mb-2 text-gray-700">Quizzes</h3>
                    {loadingQuizzes[c._id] ? (
                      <div className="text-sm text-gray-500">Loading quizzes...</div>
                    ) : quizzes[c._id]?.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {quizzes[c._id].map((q) => (
                          <div key={q._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <div>
                              <div className="font-medium text-sm text-gray-800">{q.title}</div>
                              {q.description && <div className="text-xs text-gray-600">{q.description}</div>}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditQuiz(q._id)}
                                className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteQuiz(q._id, c._id)}
                                className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No quizzes for this course.{" "}
                        <button onClick={() => openCreateQuiz(c._id)} className="ml-2 underline text-indigo-600 hover:text-indigo-700">
                          Create one
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!loading && courses.length === 0 && (
              <div className="text-gray-600 mt-6 text-center">No courses created yet.</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
