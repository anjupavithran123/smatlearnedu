// src/pages/QuizEditPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../lib/api"; // your axios instance
import { toast } from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";

export default function QuizEditPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await API.get(`/quizzes/${quizId}`);
        setQuiz(res.data.quiz);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        toast.error("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId]);

  const handleChange = (e) => {
    setQuiz({ ...quiz, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const updated = [...quiz.questions];
    updated[qIndex][field] = value;
    setQuiz({ ...quiz, questions: updated });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...quiz.questions];
    updated[qIndex].options[oIndex].text = value;
    setQuiz({ ...quiz, questions: updated });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await API.put(`/quizzes/${quizId}`, quiz);
      toast.success("Quiz updated successfully!");
      navigate("/instructor");
    } catch (err) {
      console.error("Save quiz error:", err);
      toast.error(err.response?.data?.error || "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-gray-600">Loading quiz…</div>
      </div>
    );

  if (!quiz)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-red-500">Quiz not found</div>
      </div>
    );

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-100 via-rose-50 to-violet-100 py-12 px-4">
      {/* Decorative blurred blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-pink-300 via-indigo-300 to-purple-400 opacity-30 blur-3xl transform -rotate-12 animate-[spin_50s_linear_infinite]" />
      <div className="pointer-events-none absolute -bottom-32 -right-12 w-96 h-96 rounded-full bg-gradient-to-br from-yellow-200 via-pink-200 to-indigo-200 opacity-25 blur-3xl transform rotate-6 animate-[spin_70s_linear_infinite]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-white/40 hover:bg-white/90 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Edit Quiz
            </h1>
            <p className="text-sm text-gray-600">Update title, description and questions.</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl shadow-2xl p-6 sm:p-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
              <input
                type="text"
                name="title"
                value={quiz.title || ""}
                onChange={handleChange}
                placeholder="Quiz title"
                className="w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={quiz.description || ""}
                onChange={handleChange}
                placeholder="Quiz description"
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="space-y-4">
              {quiz.questions.map((q, qi) => (
                <div
                  key={qi}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-800">Question {qi + 1}</h3>
                    <div className="text-sm text-gray-500">{q.options.length} options</div>
                  </div>

                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => handleQuestionChange(qi, "text", e.target.value)}
                    placeholder={`Question ${qi + 1}`}
                    className="w-full rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-100 mb-3"
                  />

                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <input
                            type="radio"
                            name={`correct-${qi}`}
                            checked={q.correctOptionId === opt._id}
                            onChange={() => {
                              const updated = [...quiz.questions];
                              updated[qi].correctOptionId = opt._id;
                              setQuiz({ ...quiz, questions: updated });
                            }}
                            className="h-4 w-4 text-indigo-600"
                          />
                        </div>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(qi, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <div className="text-sm text-gray-500">Tip: keep 2–6 options per question for best engagement.</div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    // simple client-side add question for convenience
                    const newQ = {
                      text: "",
                      options: [{ _id: Date.now().toString(), text: "" }, { _id: (Date.now()+1).toString(), text: "" }],
                      correctOptionId: "",
                    };
                    setQuiz({ ...quiz, questions: [...quiz.questions, newQ] });
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
                >
                  + Add Question
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">Changes are saved to your course quiz. Use the back button to return to the dashboard.</p>
      </div>
    </div>
  );
}
