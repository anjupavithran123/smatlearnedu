import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../lib/api"; // ✅ your axios instance
import { toast } from "react-hot-toast";

export default function QuizEditPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Fetch quiz by ID on mount
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

  // 🔹 Handle field changes
  const handleChange = (e) => {
    setQuiz({ ...quiz, [e.target.name]: e.target.value });
  };

  // 🔹 Handle question/option changes
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

  // 🔹 Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await API.put(`/quizzes/${quizId}`, quiz);
      toast.success("Quiz updated successfully!");
      navigate("/instructor"); // go back to instructor dashboard
    } catch (err) {
      console.error("Save quiz error:", err);
      toast.error(err.response?.data?.error || "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4">Loading quiz...</p>;
  if (!quiz) return <p className="p-4 text-red-500">Quiz not found</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Edit Quiz</h1>

      <div className="space-y-4">
        <input
          type="text"
          name="title"
          value={quiz.title || ""}
          onChange={handleChange}
          placeholder="Quiz title"
          className="w-full border rounded-lg p-2"
        />

        <textarea
          name="description"
          value={quiz.description || ""}
          onChange={handleChange}
          placeholder="Quiz description"
          className="w-full border rounded-lg p-2"
        />

        {quiz.questions.map((q, qi) => (
          <div key={qi} className="border rounded-lg p-3 mt-3">
            <input
              type="text"
              value={q.text}
              onChange={(e) =>
                handleQuestionChange(qi, "text", e.target.value)
              }
              placeholder={`Question ${qi + 1}`}
              className="w-full border p-2 mb-2 rounded"
            />
            {q.options.map((opt, oi) => (
              <div key={oi} className="ml-4 mb-2">
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) =>
                    handleOptionChange(qi, oi, e.target.value)
                  }
                  placeholder={`Option ${oi + 1}`}
                  className="w-full border p-2 rounded"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
