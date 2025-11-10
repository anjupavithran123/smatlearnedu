// src/components/ManageQuizForm.jsx
import React, { useState, useEffect } from "react";
import API from "../lib/api";

// helper to generate IDs for frontend
const generateId = () => Math.floor(Date.now() * Math.random()).toString(16).padEnd(24, "0");

export default function ManageQuizForm({ quiz, onCancel, onSaved }) {
  const [title, setTitle] = useState(quiz?.title || "");
  const [questions, setQuestions] = useState(
    quiz?.questions.map((q) => ({
      id: generateId(),
      text: q.text,
      options: q.options.map((o) => ({ id: o._id, text: o.text })),
      correctId: q.correctOptionId,
    })) || [
      { id: generateId(), text: "", options: [{ id: generateId(), text: "" }, { id: generateId(), text: "" }], correctId: "" },
    ]
  );

  const [submitting, setSubmitting] = useState(false);

  // add/remove questions
  const addQuestion = () => setQuestions([...questions, { id: generateId(), text: "", options: [{ id: generateId(), text: "" }, { id: generateId(), text: "" }], correctId: "" }]);
  const removeQuestion = (qIdx) => setQuestions(questions.filter((_, i) => i !== qIdx));

  // add/remove options
  const addOption = (qIdx) => {
    const qs = [...questions];
    qs[qIdx].options.push({ id: generateId(), text: "" });
    setQuestions(qs);
  };
  const removeOption = (qIdx, optIdx) => {
    const qs = [...questions];
    qs[qIdx].options = qs[qIdx].options.filter((_, i) => i !== optIdx);
    // adjust correctId if deleted
    if (qs[qIdx].correctId === qs[qIdx].options[optIdx]?.id) {
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
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quiz Title"
          className="w-full border rounded p-2"
          required
        />
      </div>

      {questions.map((q, qIdx) => (
        <div key={q.id} className="border p-3 mb-2 rounded">
          <input
            value={q.text}
            onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
            placeholder={`Question ${qIdx + 1}`}
            className="w-full border rounded p-2 mb-2"
          />
          {q.options.map((opt, oIdx) => (
            <div key={opt.id} className="flex items-center gap-2 mb-1">
              <input
                value={opt.text}
                onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                placeholder={`Option ${oIdx + 1}`}
                className="flex-1 border rounded p-1"
              />
              <label>
                <input
                  type="radio"
                  checked={q.correctId === opt.id}
                  onChange={() => {
                    const qs = [...questions];
                    qs[qIdx].correctId = opt.id;
                    setQuestions(qs);
                  }}
                />
                Correct
              </label>
              <button type="button" onClick={() => removeOption(qIdx, oIdx)} className="text-xs text-red-600 ml-2">
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addOption(qIdx)} className="text-xs text-blue-600">
            + Add Option
          </button>
          <button type="button" onClick={() => removeQuestion(qIdx)} className="text-xs text-red-600 ml-2">
            Remove Question
          </button>
        </div>
      ))}

      <div className="flex gap-2 mt-3">
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={submitting}>
          {submitting ? "Saving..." : "Save Quiz"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">
          Cancel
        </button>
        <button type="button" onClick={addQuestion} className="px-4 py-2 border rounded bg-blue-600 text-white">
          + Add Question
        </button>
      </div>
    </form>
  );
}
