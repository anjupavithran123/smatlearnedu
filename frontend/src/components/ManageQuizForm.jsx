// src/components/ManageQuizForm.jsx
import React, { useState } from "react";
import API from "../lib/api";
import { PlusCircle, Trash2, XCircle, Save } from "lucide-react";

// helper to generate IDs for frontend
const generateId = () =>
  Math.floor(Date.now() * Math.random()).toString(16).padEnd(24, "0");

export default function ManageQuizForm({ quiz, onCancel, onSaved }) {
  const [title, setTitle] = useState(quiz?.title || "");
  const [questions, setQuestions] = useState(
    quiz?.questions.map((q) => ({
      id: generateId(),
      text: q.text,
      options: q.options.map((o) => ({ id: o._id, text: o.text })),
      correctId: q.correctOptionId,
    })) || [
      {
        id: generateId(),
        text: "",
        options: [
          { id: generateId(), text: "" },
          { id: generateId(), text: "" },
        ],
        correctId: "",
      },
    ]
  );

  const [submitting, setSubmitting] = useState(false);

  // add/remove questions
  const addQuestion = () =>
    setQuestions([
      ...questions,
      {
        id: generateId(),
        text: "",
        options: [
          { id: generateId(), text: "" },
          { id: generateId(), text: "" },
        ],
        correctId: "",
      },
    ]);
  const removeQuestion = (qIdx) =>
    setQuestions(questions.filter((_, i) => i !== qIdx));

  // add/remove options
  const addOption = (qIdx) => {
    const qs = [...questions];
    qs[qIdx].options.push({ id: generateId(), text: "" });
    setQuestions(qs);
  };
  const removeOption = (qIdx, optIdx) => {
    const qs = [...questions];
    const removed = qs[qIdx].options.splice(optIdx, 1);
    // adjust correctId if deleted
    if (qs[qIdx].correctId === removed[0]?.id) {
      qs[qIdx].correctId = qs[qIdx].options[0]?.id || "";
    }
    setQuestions(qs);
  };

  // handle text changes
  const handleQuestionChange = (qIdx, val) => {
    const qs = [...questions];
    qs[qIdx].text = val;
    setQuestions(qs);
  };
  const handleOptionChange = (qIdx, optIdx, val) => {
    const qs = [...questions];
    qs[qIdx].options[optIdx].text = val;
    setQuestions(qs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options.map((o) => ({ _id: o.id, text: o.text })),
          correctOptionId: q.correctId || q.options[0].id,
        })),
      };
      const res = await API.put(`/quizzes/${quiz._id}`, payload);
      onSaved(res.data.quiz);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-pink-300 via-indigo-300 to-purple-400 opacity-40 blur-3xl transform -rotate-12 animate-[spin_40s_linear_infinite]" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-gradient-to-br from-yellow-200 via-pink-200 to-indigo-200 opacity-30 blur-3xl transform rotate-6 animate-[spin_60s_linear_infinite]" />

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-4xl bg-white/60 backdrop-blur-md border border-white/30 rounded-3xl shadow-2xl p-6 sm:p-8"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Manage Quiz
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Edit questions, options and mark the correct answers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-white/50 hover:bg-white/70 border border-white/40 transition"
            >
              <XCircle className="h-4 w-4 text-gray-700" />
              Cancel
            </button>
          </div>
        </header>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quiz Title"
            className="w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            required
          />
        </div>

        <div className="mt-6 space-y-4">
          {questions.map((q, qIdx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800">
                      Question {qIdx + 1}
                    </h3>
                    <div className="text-sm text-gray-500">{q.options.length} options</div>
                  </div>

                  <input
                    value={q.text}
                    onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                    placeholder={`Question ${qIdx + 1}`}
                    className="mt-3 w-full rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                  />

                  <div className="mt-4 space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 border border-gray-100"
                      >
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctId === opt.id}
                          onChange={() => {
                            const qs = [...questions];
                            qs[qIdx].correctId = opt.id;
                            setQuestions(qs);
                          }}
                          className="h-4 w-4 text-indigo-600"
                        />
                        <input
                          value={opt.text}
                          onChange={(e) =>
                            handleOptionChange(qIdx, oIdx, e.target.value)
                          }
                          placeholder={`Option ${oIdx + 1}`}
                          className="flex-1 rounded-md border border-gray-200 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, oIdx)}
                            className="text-red-600 text-xs hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => addOption(qIdx)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm hover:bg-indigo-100 transition"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Option
                    </button>

                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Question
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
            >
              <PlusCircle className="h-4 w-4" />
              Add Question
            </button>
            <div className="text-sm text-gray-500">Tip: Keep 2–6 options per question.</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border bg-white/50 hover:bg-white/70 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {submitting ? "Saving..." : "Save Quiz"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
