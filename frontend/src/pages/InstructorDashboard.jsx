import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { setAuthToken } from "../lib/api";
import { Eye, Edit, Trash2, PlusCircle } from "lucide-react"; // nice icons

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
      price: course.price ? course.price / 100 : 0, // convert paise → ₹
    });
    setEditingId(course._id || course.id || null);
    toggleCreate(true);
  };

  const fetchQuizzesForCourse = async (courseId) => {
    if (!courseId) return;
    setLoadingQuizzes((s) => ({ ...s, [courseId]: true }));
    try {
      const res = await API.get(`/quizzes?courseId=${courseId}`);
      const list = res.data.quizzes || [];
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
    <div className="min-h-screen bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Instructor Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/instructor/dashboard")}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              View Details
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow transition"
            >
              <PlusCircle className="w-4 h-4" /> Create Course
            </button>
            {showCreate && (
              <button
                onClick={() => {
                  resetForm();
                  toggleCreate(false);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Course Form */}
        <div
          ref={formRef}
          className={`overflow-hidden transition-all duration-300 ${
            showCreate ? "max-h-[1300px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {editingId ? "Edit Course" : "Create Course"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Course Title"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Course Description"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                rows={4}
              />
              <div>
                <label className="block font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="Enter 0 for free course"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Video URLs</label>
                {form.videoLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-2">
                    <input
                      value={link}
                      onChange={(e) => handleVideoChange(idx, e.target.value)}
                      placeholder={`Video URL #${idx + 1}`}
                      className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeVideoInput(idx)}
                      className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVideoInput}
                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition"
                >
                  + Add Video
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className={`px-4 py-2 rounded text-white shadow ${
                    editingId
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-green-500 hover:bg-green-600"
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
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
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
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}

          <div className="grid gap-4">
            {courses.map((c) => (
              <div
                key={c._id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-900">{c.title}</div>
                    <div className="text-sm text-gray-600">{c.description}</div>
                    <div className="text-sm text-gray-500">Price: ₹{(c.price || 0) / 100}</div>
                    {Array.isArray(c.videoLinks) && c.videoLinks.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {c.videoLinks.length} video{c.videoLinks.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* Colorful Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/courses/${c._id}`)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-500 text-white rounded hover:bg-teal-600 transition"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-500 text-white rounded hover:bg-amber-600 transition"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    <button
                      onClick={() => openCreateQuiz(c._id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition"
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
                        <div
                          key={q._id}
                          className="flex justify-between items-center bg-gray-50 p-2 rounded"
                        >
                          <div>
                            <div className="font-medium text-sm text-gray-800">{q.title}</div>
                            {q.description && (
                              <div className="text-xs text-gray-600">{q.description}</div>
                            )}
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
                      <button
                        onClick={() => openCreateQuiz(c._id)}
                        className="ml-2 underline text-orange-600 hover:text-orange-700"
                      >
                        Create one
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!loading && courses.length === 0 && (
            <div className="text-gray-600 mt-4 text-center">
              No courses created yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
