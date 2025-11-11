// src/pages/QuizPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../lib/api";
import { CheckCircle, XCircle } from "lucide-react";

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
      setResult(res.data);
      // optional: scroll to result
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submit error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to submit quiz";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-100 via-rose-50 to-violet-100">
        <div className="text-gray-600">Loading quiz…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-100 via-rose-50 to-violet-100">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }
  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-100 via-rose-50 to-violet-100">
        <div className="text-gray-600">Quiz not found.</div>
      </div>
    );
  }

  // Build quick lookup for feedback mapping
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

  const totalQuestions = (quiz.questions || []).length;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount > 0 && !submitting;

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-100 via-rose-50 to-violet-100 py-12 px-4">
      {/* decorative blurred blobs */}
      <div className="pointer-events-none absolute -left-32 -top-24 w-72 h-72 rounded-full bg-gradient-to-tr from-pink-300 via-indigo-300 to-purple-400 opacity-30 blur-3xl transform -rotate-12 animate-[spin_60s_linear_infinite]" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-gradient-to-br from-yellow-200 via-pink-200 to-indigo-200 opacity-25 blur-3xl transform rotate-6 animate-[spin_90s_linear_infinite]" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header / card */}
        <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{quiz.title || "Quiz"}</h1>
              {quiz.description && <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>}
              <div className="mt-3 text-xs text-gray-500">
                {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} • Answered {answeredCount}/{totalQuestions}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-2 rounded-md bg-blue-500 text-white shadow hover:bg-blue-600 transition" >
             
                 Back
           </button>


              {result ? (
                <div className="text-sm">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Score: {result.score}/{result.total}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Good luck!</div>
              )}
            </div>
          </div>
        </div>

        {/* Result panel */}
        {result && (
          <div className="mb-6">
            <div className="bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Result</h2>
                  <p className="text-sm text-gray-600">
                    You scored <strong>{result.score}</strong> of <strong>{result.total}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // show answers again: keep result visible
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Review Answers
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    className="px-3 py-2 rounded-md bg-emerald-500 text-white shadow hover:bg-emerald-600 transition" >
                    Back to Course
                  </button>
 
                </div>
              </div>

              {Array.isArray(result.feedback) && result.feedback.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.feedback.map((f) => {
                    const qid = String(f.questionId);
                    const qmeta = questionIndexById[qid];
                    const qNum = qmeta ? qmeta.index : qid;
                    const correct = Boolean(f.correct);
                    const correctOptId = f.correctOptionId ? String(f.correctOptionId) : null;
                    const correctOptText =
                      correctOptId && qmeta && qmeta.optionsById[correctOptId]
                        ? qmeta.optionsById[correctOptId].text
                        : null;

                    return (
                      <div key={qid} className="p-3 border rounded-md bg-white">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            Question {qNum} — {correct ? <span className="text-green-700">Correct</span> : <span className="text-red-700">Wrong</span>}
                          </div>
                          {!correct ? <XCircle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
                        </div>
                        {!correct && (
                          <div className="mt-2 text-sm text-gray-700">
                            {correctOptText ? (
                              <>Correct answer: <strong>{correctOptText}</strong></>
                            ) : (
                              <>Correct option id: <code>{correctOptId ?? "N/A"}</code></>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz questions */}
        {!result && (
          <div className="space-y-4">
            {(quiz.questions || []).map((q, qi) => (
              <div key={String(q._id) || qi} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="font-semibold text-gray-800">
                    {qi + 1}. {q.text}
                  </div>
                  <div className="text-xs text-gray-400">{(q.options || []).length} options</div>
                </div>

                <div className="mt-3 grid gap-3">
                  {(q.options || []).map((opt) => {
                    const checked = String(answers[q._id]) === String(opt._id);
                    return (
                      <label
                        key={String(opt._id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                          checked ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-100 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="radio"
                          name={String(q._id)}
                          checked={checked}
                          onChange={() => handleSelect(q._id, opt._id)}
                          className="h-4 w-4 text-indigo-600"
                        />
                        <span className="text-gray-700">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Footer actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Answered {answeredCount}/{totalQuestions}
              </div>

              <div className="flex items-center gap-3">
              <button
                  onClick={() => {
                  setAnswers({});
                  setResult(null);
                 }}
               className="px-3 py-2 rounded-md bg-amber-500 text-white shadow hover:bg-amber-600 transition">
                Reset
            </button>

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`px-4 py-2 rounded-md text-white shadow ${
                    canSubmit ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"
                  } transition`}
                >
                  {submitting ? "Submitting…" : "Submit Quiz"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
