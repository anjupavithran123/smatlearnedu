// src/pages/QuizPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../lib/api";

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({}); // { questionId: optionId }
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Missing quiz id");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    API.get(`/quizzes/${id}`)
      .then((res) => {
        // Accept both { quiz: {...} } and direct object
        const payload = res.data?.quiz ?? res.data;
        if (!mounted) return;
        if (!payload) {
          setError("Invalid quiz response from server");
          setQuiz(null);
          return;
        }
        setQuiz(payload);
      })
      .catch((err) => {
        console.error("Failed to fetch quiz:", err);
        const msg = err.response?.data?.error || err.message || "Failed to load quiz";
        setError(msg);
        if (err.response?.status === 404) {
          setTimeout(() => navigate(-1), 1200);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const handleSelect = (questionId, optionId) => {
    setAnswers((s) => ({ ...s, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const payload = (quiz.questions || []).map((q) => ({
      questionId: String(q._id),
      selectedOptionId: String(answers[q._id] ?? ""),
    }));

    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await API.post(`/quizzes/${id}/submit`, { answers: payload });
      // server returns { success, score, total, feedback }
      setResult(res.data);
    } catch (err) {
      console.error("Submit error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to submit quiz";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading quiz…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!quiz) return <div className="p-6">Quiz not found.</div>;

  // Build a quick lookup: questionId -> { index (1-based), question, options map }
  const questionIndexById = {};
  (quiz.questions || []).forEach((q, idx) => {
    questionIndexById[String(q._id)] = {
      index: idx + 1,
      question: q,
      optionsById: (q.options || []).reduce((acc, opt) => {
        acc[String(opt._id)] = opt;
        return acc;
      }, {}),
    };
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{quiz.title || "Quiz"}</h1>
      <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>

      {result ? (
        <div className="p-4 border rounded bg-green-50">
          <h2 className="font-semibold">Result</h2>
          <p>
            Score: {result.score} / {result.total}
          </p>

          {/* Improved feedback rendering using numeric question index */}
          {Array.isArray(result.feedback) && (
            <div className="mt-3">
              <h3 className="font-medium">Feedback</h3>
              <ul className="list-none pl-0 text-sm space-y-2">
                {result.feedback.map((f) => {
                  const qid = String(f.questionId);
                  const qmeta = questionIndexById[qid];
                  const qNum = qmeta ? qmeta.index : qid; // fallback to id if not found
                  const correct = Boolean(f.correct);
                  // If server provided correctOptionId, get the option text
                  const correctOptId = f.correctOptionId ? String(f.correctOptionId) : null;
                  const correctOptText =
                    correctOptId && qmeta && qmeta.optionsById[correctOptId]
                      ? qmeta.optionsById[correctOptId].text
                      : null;

                  return (
                    <li key={qid} className="p-2 border rounded">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          Question {qNum}: {correct ? <span className="text-green-700">Correct</span> : <span className="text-red-700">Wrong</span>}
                        </div>
                        {/* optional: show selected vs correct */}
                      </div>

                      {!correct && (
                        <div className="mt-1 text-sm text-gray-700">
                          {correctOptText ? (
                            <>Correct answer: <strong>{correctOptText}</strong></>
                          ) : (
                            <>Correct option id: <code>{correctOptId ?? "N/A"}</code></>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {(quiz.questions || []).map((q, qi) => (
              <div key={String(q._id) || qi} className="p-4 border rounded">
                <div className="font-semibold mb-2">
                  {qi + 1}. {q.text}
                </div>
                <div className="space-y-2">
                  {(q.options || []).map((opt) => (
                    <label key={String(opt._id)} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={String(q._id)}
                        checked={String(answers[q._id]) === String(opt._id)}
                        onChange={() => handleSelect(q._id, opt._id)}
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Quiz"}
            </button>

            <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
