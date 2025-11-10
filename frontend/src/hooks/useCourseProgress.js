// src/hooks/useCourseProgress.js
import { useState, useEffect, useCallback } from "react";
import API from "../lib/api";

/**
 * useCourseProgress(courseId)
 * - courseId: string | null
 * - totalItems: number (optional, computed from course after load)
 *
 * Returns:
 * { loading, progress, quizzesAttempted, error, fetchProgress, markComplete, recordQuizAttempt }
 */
export default function useCourseProgress(courseId) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ percentComplete: 0, completedItems: [] });
  const [quizzesAttempted, setQuizzesAttempted] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Fetch progress from backend
   * - totalItems: number (optional, used to calculate percentComplete)
   */
  const fetchProgress = useCallback(
    async (totalItems) => {
      if (!courseId) {
        setProgress({ percentComplete: 0, completedItems: [] });
        setQuizzesAttempted(0);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await API.get(`/progress/course/${courseId}`);
        let data = res?.data || {};
        const completedItems = data.progress?.completedItems || [];
        const quizzesCount = data.quizzesAttempted ?? 0;

        // compute percentComplete
        const items = totalItems || completedItems.length || 1; // fallback to avoid division by zero
        const percentComplete = Math.round((completedItems.length / items) * 100);

        setProgress({ completedItems, percentComplete });
        setQuizzesAttempted(quizzesCount);
      } catch (err) {
        console.error("fetchProgress error:", err?.response?.data || err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  /**
   * Mark an item complete
   * - itemId: string (e.g. "video:<courseId>:0")
   * - totalItems: number (optional, used to calculate percentComplete)
   */
  const markComplete = useCallback(
    async (itemId, totalItems) => {
      try {
        const res = await API.post(`/progress/course/${courseId}/complete`, { itemId });
        const completedItems = res.data?.progress?.completedItems || [];

        const items = totalItems || completedItems.length || 1;
        const percentComplete = Math.round((completedItems.length / items) * 100);

        setProgress({ completedItems, percentComplete });
        return { completedItems, percentComplete };
      } catch (err) {
        console.error("markComplete error:", err);
        throw err;
      }
    },
    [courseId]
  );

  /**
   * Record a quiz attempt (creates a QuizAttempt on backend)
   * Updates quizzesAttempted locally for immediate UI feedback.
   */
  const recordQuizAttempt = useCallback(
    async ({ quizId, correct, total, score }) => {
      if (!quizId) throw new Error("recordQuizAttempt: quizId required");

      try {
        const res = await API.post("/progress/quiz-attempt", { quizId, courseId, correct, total, score });
        setQuizzesAttempted((n) => n + 1);
        return res.data.attempt ?? res.data;
      } catch (err) {
        console.error("recordQuizAttempt error:", err?.response?.data || err);
        setError(err);
        throw err;
      }
    },
    [courseId]
  );

  return {
    loading,
    progress,
    quizzesAttempted,
    error,
    fetchProgress,
    markComplete,
    recordQuizAttempt,
  };
}
