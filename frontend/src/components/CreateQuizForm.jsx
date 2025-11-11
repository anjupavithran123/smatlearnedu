// src/components/CreateQuizForm.jsx
import React, { useState } from "react";
import API from "../lib/api";
import { ObjectId } from "bson";
import { PlusCircle, Trash2, XCircle, CheckCircle } from "lucide-react";

export default function CreateQuizForm({ courseId, onCancel, onCreated }) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", ""], correctIndex: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addQuestion = () =>
    setQuestions([...questions, { text: "", options: ["", ""], correctIndex: 0 }]);
  const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));
  const handleOptionChange = (qIdx, optIdx, val) => {
    const qs = [...questions];
    qs[qIdx].options[optIdx] = val;
    setQuestions(qs);
  };
  const addOption = (qIdx) => {
    const qs = [...questions];
    qs[qIdx].options.push("");
    setQuestions(qs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        courseId,
        questions: questions.map((q) => {
          const optionObjs = q.options.map((opt) => ({
            _id: new ObjectId(),
            text: opt,
          }));
          return {
            text: q.text,
            options: optionObjs,
            correctOptionId: optionObjs[q.correctIndex]._id,
          };
        }),
      };
      const res = await API.post("/quizzes", payload);
      onCreated(res.data.quiz);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-pink-100 to-purple-200 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl p-8 border border-white/40 space-y-6 transition-all hover:shadow-indigo-300/30"
      >
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 drop-shadow-sm">
              ✏️ Create a New Quiz
            </h2>
            <p className="text-sm text-gray-600">
              Add engaging questions and mark the correct options.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 border hover:bg-gray-100 hover:text-gray-800 transition"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
        </header>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quiz Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. JavaScript Basics Quiz"
            className="w-full border border-gray-200 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none transition"
            required
          />
        </div>

        <div className="space-y-6">
          {questions.map((q, i) => (
            <div
              key={i}
              className="bg-white/80 border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Question {i + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>

              <input
                value={q.text}
                onChange={(e) => {
                  const qs = [...questions];
                  qs[i].text = e.target.value;
                  setQuestions(qs);
                }}
                placeholder={`Enter question ${i + 1}`}
                className="mt-3 w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-200 outline-none"
                required
              />

              <div className="mt-4 space-y-2">
                {q.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg p-2 hover:shadow-sm transition"
                  >
                    <input
                      type="radio"
                      checked={q.correctIndex === idx}
                      onChange={() => {
                        const qs = [...questions];
                        qs[i].correctIndex = idx;
                        setQuestions(qs);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-300"
                    />
                    <input
                      value={opt}
                      onChange={(e) => handleOptionChange(i, idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 border border-gray-200 rounded-md p-2 focus:ring-1 focus:ring-indigo-200 outline-none"
                      required
                    />
                    {q.correctIndex === idx ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Correct
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const qs = [...questions];
                          qs[i].correctIndex = idx;
                          setQuestions(qs);
                        }}
                        className="text-xs text-gray-500 hover:text-indigo-600 transition"
                      >
                        Mark
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addOption(i)}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm hover:bg-indigo-100 transition"
              >
                <PlusCircle className="h-4 w-4" />
                Add Option
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Add Question
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Quiz"}
          </button>
        </div>
      </form>
    </div>
  );
}
