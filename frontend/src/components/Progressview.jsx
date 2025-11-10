import React from "react";
import useCourseProgress from "../hooks/useCourseProgress";
import CourseProgressBar from "./CourseProgressBar";

export default function CourseView({ courseId }) {
  const { loading, progress, quizzesAttempted } = useCourseProgress(courseId);

  if (loading) return <div>Loading progress...</div>;

  return (
    <div>
      <h2>Course progress</h2>
      <CourseProgressBar percent={progress?.percentComplete || 0} />
      <p className="mt-2 text-sm text-gray-600">Quizzes attempted: {quizzesAttempted}</p>
    </div>
  );
}
