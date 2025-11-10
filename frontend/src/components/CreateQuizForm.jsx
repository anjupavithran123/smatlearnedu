// src/components/CreateQuizForm.jsx
import React, { useState } from "react";
import API from "../lib/api";
import { ObjectId } from "bson"; // For MongoDB ObjectIds

export default function CreateQuizForm({ courseId, onCancel, onCreated }) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", ""], correctIndex: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Add a new question
  const addQuestion = () =>
    setQuestions([...questions, { text: "", options: ["", ""], correctIndex: 0 }]);

  // Remove a question
  const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));

  // Update option text
  const handleOptionChange = (qIdx, optIdx, val) => {
    const qs = [...questions];
    qs[qIdx].options[optIdx] = val;
    setQuestions(qs);
  };

  // Add new option to a question
  const addOption = (qIdx) => {
    const qs = [...questions];
    qs[qIdx].options.push("");
    setQuestions(qs);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Build payload with ObjectIds
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quiz Title"
          className="w-full border rounded p-2"
          required
        />
      </div>

      {questions.map((q, i) => (
        <div key={i} className="border p-3 rounded space-y-2">
          <input
            value={q.text}
            onChange={(e) => {
              const qs = [...questions];
              qs[i].text = e.target.value;
              setQuestions(qs);
            }}
            placeholder={`Question ${i + 1}`}
            className="w-full border rounded p-2"
            required
          />

          {q.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => handleOptionChange(i, idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1 border rounded p-1"
                required
              />
              <label className="text-sm">
                <input
                  type="radio"
                  checked={q.correctIndex === idx}
                  onChange={() => {
                    const qs = [...questions];
                    qs[i].correctIndex = idx;
                    setQuestions(qs);
                  }}
                />{" "}
                Correct
              </label>
            </div>
          ))}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addOption(i)}
              className="text-xs text-blue-600"
            >
              + Add Option
            </button>
            <button
              type="button"
              onClick={() => removeQuestion(i)}
              className="text-xs text-red-600"
            >
              Remove Question
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Quiz"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={addQuestion}
          className="px-4 py-2 border rounded bg-blue-600 text-white"
        >
          + Add Question
        </button>
      </div>
    </form>
  );
}
