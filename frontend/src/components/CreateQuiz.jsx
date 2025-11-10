// src/pages/CreateQuizPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import CreateQuizForm from "../components/CreateQuizForm"; // you'll implement this

export default function CreateQuizPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex justify-center">
      <div className="w-full max-w-3xl bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Create Quiz</h1>

        <CreateQuizForm
          courseId={courseId}
          onCancel={() => navigate("/instructor")}
          onCreated={(quiz) => {
            alert(`Quiz created: ${quiz.title}`);
            navigate(`/quiz/${quiz._id}`); // redirect to quiz page after creation
          }}
        />
      </div>
    </div>
  );
}
